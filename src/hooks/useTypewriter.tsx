
import { useState, useEffect } from 'react';

interface UseTypewriterProps {
  words: string[];
  loop?: boolean;
  delayBetweenWords?: number;
  typeSpeed?: number;
  deleteSpeed?: number;
}

export const useTypewriter = ({
  words,
  loop = true,
  delayBetweenWords = 2000,
  typeSpeed = 150,
  deleteSpeed = 100,
}: UseTypewriterProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
        setIsDeleting(true);
        return;
      }

      if (isDeleting) {
        setCurrentText(currentWord.substring(0, currentText.length - 1));
        
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => {
            if (loop) {
              return (prev + 1) % words.length;
            }
            return prev < words.length - 1 ? prev + 1 : prev;
          });
        }
      } else {
        setCurrentText(currentWord.substring(0, currentText.length + 1));
        
        if (currentText === currentWord) {
          if (loop || currentWordIndex < words.length - 1) {
            setIsPaused(true);
          }
        }
      }
    }, isPaused ? delayBetweenWords : isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timeout);
  }, [
    currentText,
    currentWordIndex,
    isDeleting,
    isPaused,
    words,
    loop,
    delayBetweenWords,
    typeSpeed,
    deleteSpeed,
  ]);

  return currentText;
};
