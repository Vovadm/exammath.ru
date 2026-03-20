import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { taskApi } from '@/entities/task/api/task-api';
import { useAuth } from '@/features/auth/model/auth-context';

export function useTaskRating(taskId: number, initialLikes: number, initialDislikes: number) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes || 0);
  const [dislikes, setDislikes] = useState(initialDislikes || 0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setUserVote(null);
      return;
    }
    taskApi.getVote(taskId).then(res => {
      setUserVote(res.vote);
    }).catch(() => {});
  }, [taskId, user]);

  const handleVote = async (targetVote: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Пожалуйста, войдите в аккаунт, чтобы оценивать задания');
      return;
    }
    if (isLoading) return;

    const newVote = userVote === targetVote ? null : targetVote;

    const prevVote = userVote;
    const prevLikes = likes;
    const prevDislikes = dislikes;

    setUserVote(newVote);
    if (prevVote === 'like') setLikes(l => l - 1);
    if (prevVote === 'dislike') setDislikes(d => d - 1);
    if (newVote === 'like') setLikes(l => l + 1);
    if (newVote === 'dislike') setDislikes(d => d + 1);

    setIsLoading(true);
    try {
      const res = await taskApi.vote(taskId, newVote);
      setLikes(res.likes);
      setDislikes(res.dislikes);
      setUserVote(res.user_vote as 'like' | 'dislike' | null);
    } catch {
      setUserVote(prevVote);
      setLikes(prevLikes);
      setDislikes(prevDislikes);
      toast.error('Не удалось сохранить оценку');
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    likes, 
    dislikes, 
    userVote, 
    handleLike: () => handleVote('like'), 
    handleDislike: () => handleVote('dislike') 
  };
}