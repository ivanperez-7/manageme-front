import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, ChevronDown, ChevronUp, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  errorDetail?: string;
}

export const Route = createFileRoute('/_app/chatbot')({
  staticData: { headerBreadcrumb: [{ label: 'Chatbot' }] },
  component: ChatbotPage,
  errorComponent: ErrorState,
});

const suggestions = [
  '¿Cuántos productos hay en el inventario?',
  '¿Qué productos tienen bajo stock?',
  '¿Cuál es el producto más caro?',
  '¿Qué proveedores tenemos registrados?',
  // '¿Cuántos clientes hay registrados?',
  // '¿Qué movimientos de entrada hubo recientemente?',
  // '¿Cuántas categorías de productos existen?',
  // '¿Qué equipos están disponibles?',
];

function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (pregunta: string) => withAuth.post(ENDPOINTS.chat, { pregunta }).then((res) => res.data),
    onSuccess: (data) =>
      setMessages((prev) => [...prev, { role: 'assistant', content: data.respuesta ?? '' }]),
    onError: (error: unknown) => {
      const detail =
        error instanceof Object && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;

      setMessages((prev) => [...prev, { role: 'assistant', content: '', isError: true, errorDetail: detail }]);
    },
  });

  const loading = chatMutation.isPending;

  const sendMessage = (text?: string) => {
    const pregunta = text ?? input.trim();
    if (!pregunta || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: pregunta }]);
    chatMutation.mutate(pregunta);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      <div className='flex items-center gap-3 border-b px-6'>
        <div className='relative'>
          <div className='flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary'>
            <Bot className='size-5' />
          </div>
          <span className='absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-background' />
        </div>
        <div>
          <h1 className='text-lg font-semibold'>Asistente</h1>
          <p className='text-xs text-muted-foreground'>Responde dudas sobre el inventario</p>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className='flex-1 min-h-0 min-w-0 px-6 py-4'>
        {messages.length === 0 && !loading && (
          <div className='flex h-full flex-col items-center justify-center gap-3 text-center'>
            <div className='flex items-center justify-center size-16 rounded-2xl bg-primary/5 text-primary'>
              <Bot className='size-8' />
            </div>
            <div>
              <p className='text-sm font-medium'>¿En qué puedo ayudarte?</p>
              <p className='text-xs text-muted-foreground mt-1'>Escribe un mensaje para comenzar.</p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, i) => (
            <MessageBubble key={i} message={message} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            className='flex items-start gap-3 mt-4'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className='flex items-center justify-center size-8 rounded-lg bg-muted shrink-0 mt-0.5'>
              <Bot className='size-4 text-muted-foreground' />
            </div>
            <div className='bg-muted rounded-xl px-4 py-3'>
              <span className='inline-flex gap-1'>
                <span className='size-1.5 rounded-full bg-muted-foreground animate-bounce' />
                <span className='size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]' />
                <span className='size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]' />
              </span>
            </div>
          </motion.div>
        )}
      </ScrollArea>

      <div className='border-t px-6 pt-4 pb-3 space-y-3 min-w-0'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className='flex w-full gap-2'
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Escribe un mensaje...'
            disabled={loading}
            className='bg-muted/50 border-muted focus-visible:bg-background transition-colors'
          />
          <Button type='submit' size='icon' title='Enviar' aria-label='Enviar' disabled={loading || !input.trim()}>
            <Send />
          </Button>
        </form>

        {/* Suggestion scrollbar */}
        <div className='min-w-0'>
          <div className='max-w-full scrollbar-none'>
            <div className='flex gap-2 pb-1'>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type='button'
                  disabled={loading}
                  onClick={() => sendMessage(s)}
                  className='shrink-0 rounded-full border bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 whitespace-nowrap'
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex items-start gap-3 mt-4 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div
        className={`flex items-center justify-center size-8 rounded-lg shrink-0 mt-0.5 ${
          isUser ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        {isUser ? <User className='size-4' /> : <Bot className='size-4' />}
      </div>

      {isUser ? (
        <div className='bg-primary text-primary-foreground max-w-[70%] rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap'>
          {message.content}
        </div>
      ) : message.isError ? (
        <ErrorText detail={message.errorDetail} />
      ) : (
        <div className='bg-muted text-foreground max-w-[70%] rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap'>
          {message.content}
        </div>
      )}
    </motion.div>
  );
}

function ErrorText({ detail }: { detail?: string }) {
  const [expandedError, setExpandedError] = useState<boolean>(false);
  return (
    <div className='max-w-[70%] space-y-1'>
      <button
        type='button'
        onClick={() => setExpandedError((v) => !v)}
        className='flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 dark:text-red-400'
      >
        <AlertCircle className='size-4 shrink-0' />
        <span className='text-left'>Ocurrió un error al procesar tu mensaje</span>
        {detail &&
          (expandedError ? (
            <ChevronUp className='size-3.5 shrink-0' />
          ) : (
            <ChevronDown className='size-3.5 shrink-0' />
          ))}
      </button>
      {detail && expandedError && (
        <pre className='whitespace-pre-wrap bg-muted rounded-md p-3 text-xs text-red-500'>
          {detail}
        </pre>
      )}
    </div>
  );
}
