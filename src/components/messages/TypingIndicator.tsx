import React from 'react';

interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  currentUserId
}) => {
  const otherTypingUsers = typingUsers.filter(id => id !== currentUserId);
  
  if (otherTypingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (otherTypingUsers.length === 1) {
      return "Someone is typing...";
    } else if (otherTypingUsers.length === 2) {
      return "2 people are typing...";
    } else {
      return `${otherTypingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};