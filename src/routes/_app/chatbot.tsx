import { createFileRoute, ErrorComponent } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useHeader } from '@/components/site-header';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  component: ChatbotPage,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { setContent } = useHeader();

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await withAuth.post(ENDPOINTS.chat, { pregunta: text });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.respuesta ?? '' }]);
    } catch (error: unknown) {
      const detail =
        error instanceof Object && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          isError: true,
          errorDetail: detail,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    setContent(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Chatbot</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    return () => setContent(null);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Chatbot</h1>
        <p className='text-muted-foreground'>Consulta tus dudas con el asistente.</p>
      </div>
      <Card className='flex h-[calc(100vh-14rem)] flex-col'>
        <CardHeader>
          <CardTitle>Asistente</CardTitle>
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden'>
          <ScrollArea ref={scrollRef} className='h-full pr-4'>
            <div className='space-y-4'>
              {messages.length === 0 && (
                <p className='text-muted-foreground text-center text-sm'>
                  Escribe un mensaje para comenzar.
                </p>
              )}
              <AnimatePresence initial={false}>
                {messages.map((message, i) => (
                  <MessageBubble key={i} message={message} />
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div
                  className='flex justify-start'
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className='bg-muted text-muted-foreground max-w-[80%] rounded-xl px-4 py-2 text-sm'>
                    <span className='inline-flex gap-1'>
                      <span className='animate-bounce'>.</span>
                      <span className='animate-bounce [animation-delay:0.1s]'>.</span>
                      <span className='animate-bounce [animation-delay:0.2s]'>.</span>
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
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
            />
            <Button type='submit' size='icon' disabled={loading || !input.trim()}>
              <Send />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <motion.div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {message.role === 'user' ? (
        <div className='bg-primary text-primary-foreground max-w-[80%] rounded-xl px-4 py-2 text-sm'>
          {message.content}
        </div>
      ) : message.isError ? (
        <ErrorText detail={message.errorDetail} />
      ) : (
        <div className='bg-muted text-muted-foreground max-w-[80%] rounded-xl px-4 py-2 text-sm'>
          {message.content}
        </div>
      )}
    </motion.div>
  );
}

function ErrorText({ detail }: { detail?: string }) {
  const [expandedError, setExpandedError] = useState<boolean>(false);
  return (
    <div className='max-w-[80%] space-y-1'>
      <button
        type='button'
        onClick={() => setExpandedError((v) => !v)}
        className='flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 dark:text-red-400'
      >
        <AlertCircle className='size-4 shrink-0' />
        <span className=' text-left'>Ocurrió un error al procesar tu mensaje</span>
        {detail &&
          (expandedError ? (
            <ChevronUp className='size-3.5 shrink-0' />
          ) : (
            <ChevronDown className='size-3.5 shrink-0' />
          ))}
      </button>
      {detail && expandedError && (
        <pre className='wrap-break-word whitespace-pre-wrap bg-muted max-w-[80%] rounded-md p-3 text-xs text-red-500'>
          {detail}
        </pre>
      )}
    </div>
  );
}
