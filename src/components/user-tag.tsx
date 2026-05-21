import { Avatar, AvatarFallback } from './ui/avatar';

function UserTag({ username }: { username: string }) {
  return (
    <div className='flex gap-2.5 items-center'>
      <Avatar>
        <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {username}
    </div>
  );
}

export default UserTag;
