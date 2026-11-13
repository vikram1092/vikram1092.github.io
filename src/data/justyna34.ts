export interface BirthdayMemory {
  id: string;
  photo: string;
  alt: string;
  /** Adjust the crop for each real photo, e.g. '50% 30%'. The full photo opens on tap. */
  position?: string;
  question: string;
  options: { id: string; label: string }[];
  /** Omit for a question with no wrong answers; otherwise use one of the option IDs. */
  correctOption?: string;
}

// Replace these preview images and questions when the birthday content is ready.
// Bump the revision when changing questions to avoid restoring old preview answers.
export const birthdayRevision = 'preview-1';

export const memories: BirthdayMemory[] = [
  { id: 'memory-01', photo: '/justyna34/photos/coast.jpg', alt: 'Placeholder photo: a wooden boat on a mountain lake', position: '50% 55%' },
  { id: 'memory-02', photo: '/justyna34/photos/flowers.jpg', alt: 'Placeholder photo: golden flowers in the sunshine' },
  { id: 'memory-03', photo: '/justyna34/photos/sea.jpg', alt: 'Placeholder photo: soft waves on the sea' },
  { id: 'memory-04', photo: '/justyna34/photos/mountains.jpg', alt: 'Placeholder photo: a mountain beneath the clouds' },
  { id: 'memory-05', photo: '/justyna34/photos/sunset.jpg', alt: 'Placeholder photo: a warm sunset over the hills' },
].map((memory) => ({
  ...memory,
  question: 'Your question goes here',
  options: [
    { id: 'a', label: 'Answer one' },
    { id: 'b', label: 'Answer two' },
    { id: 'c', label: 'Answer three' },
  ],
}));
