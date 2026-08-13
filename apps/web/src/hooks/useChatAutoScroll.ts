'use client';

import { useEffect, useRef, type RefObject } from 'react';

const AUTO_SCROLL_THRESHOLD = 120;

interface UseChatAutoScrollParams {
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  messageCount: number;
  isLoadingMore: boolean;
  isOtherTyping: boolean;
}

export function useChatAutoScroll({
  messagesContainerRef,
  messageCount,
  isLoadingMore,
  isOtherTyping,
}: UseChatAutoScrollParams) {
  const prevScrollHeightRef = useRef<number>(0);
  const userSentRef = useRef<boolean>(false);

  const handleLoadMore = async (loadMoreFn: () => Promise<void>) => {
    if (messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
    await loadMoreFn();
  };

  const markUserSent = () => {
    userSentRef.current = true;
  };

  const clearUserSent = () => {
    userSentRef.current = false;
  };

  // Restore scroll position after earlier messages are loaded into DOM
  useEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current > 0 && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const heightDelta = newScrollHeight - prevScrollHeightRef.current;
      messagesContainerRef.current.scrollTop = heightDelta;
      prevScrollHeightRef.current = 0;
    }
  }, [messageCount, isLoadingMore, messagesContainerRef]);

  // Smart auto-scroll message container to bottom on NEW messages or typing updates
  // (Only scrolls if user is near bottom within AUTO_SCROLL_THRESHOLD or sent a message)
  useEffect(() => {
    if (isLoadingMore || prevScrollHeightRef.current > 0 || !messagesContainerRef.current) {
      return;
    }
    const container = messagesContainerRef.current;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom <= AUTO_SCROLL_THRESHOLD;

    if (isNearBottom || userSentRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
      userSentRef.current = false;
    }
  }, [messageCount, isLoadingMore, isOtherTyping, messagesContainerRef]);

  return {
    handleLoadMore,
    markUserSent,
    clearUserSent,
  };
}
