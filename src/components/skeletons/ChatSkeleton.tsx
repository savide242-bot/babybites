import { Skeleton } from "@/components/ui/skeleton";

export const ChatMessageSkeleton = ({ isUser = false }: { isUser?: boolean }) => {
  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-pulse`}>
      {!isUser && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Skeleton className={`h-20 ${isUser ? 'w-64' : 'w-80'} rounded-2xl`} />
      </div>
      {isUser && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
    </div>
  );
};

export const ChatSkeletonGroup = () => {
  return (
    <div className="space-y-6">
      <ChatMessageSkeleton isUser />
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isUser />
    </div>
  );
};
