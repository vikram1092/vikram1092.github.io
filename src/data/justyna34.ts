export interface BirthdayMemory {
  id: string;
  /** Still image, or the poster for a video. */
  photo: string;
  video?: string;
  width: number;
  height: number;
  alt: string;
  question: string;
  /** Empty for captions and open-ended prompts without answer choices. */
  options: { id: string; label: string }[];
  /** Omit for a question with no wrong answers; otherwise use one of the option IDs. */
  correctOption?: string;
}

// All 35 shared-album items, sorted oldest to newest by capture date below.
// IDs stay attached to their original media so saved answers survive reordering.
// Capture dates come from original EXIF/QuickTime metadata, with iCloud Date
// Captured for memories 12, 26, 27, 32, and 35. Dates are omitted from page data.
// Live Photos use their still image.
// Bump the revision when changing questions to discard old preview answers.
export const birthdayRevision = 'birthday-story-1';

type BirthdayCopy = Pick<BirthdayMemory, 'question'> & Partial<Pick<BirthdayMemory, 'options' | 'correctOption'>>;
function quiz(question: string, labels: string[], correctIndex: number): BirthdayCopy {
  return { question, options: labels.map((label, index) => ({ id: String(index), label })), correctOption: String(correctIndex) };
}

// Copy is attached to stable media IDs in the supplied chronological story order.
const birthdayCopy: Record<string, BirthdayCopy> = {
  'memory-03': { question: 'Once in my life…' },
  'memory-16': { question: 'I met a very special person,' },
  'memory-15': { question: 'a horse whisperer,' },
  'memory-11': quiz('who could fall asleep anywhere, like here', ['Krakow', 'Jaisalmer', 'Greece'], 0),
  'memory-27': { question: 'who bites me often' },
  'memory-24': { question: 'and scratches me at times' },
  'memory-30': quiz('and was the secretary of', ['Med school', 'Residency', 'The VA'], 2),
  'memory-02': { question: 'sometimes a brat,' },
  'memory-32': quiz('a brave little', ['Soldier', 'Engineer', 'Doctor'], 0),
  'memory-26': { question: 'my dearest friend,' },
  'memory-19': { question: 'and the funniest too.' },
  'memory-06': { question: 'Do you remember why you were crying?' },
  'memory-23': { question: 'My Waaaiiff' },
  'memory-12': quiz('Where was this taken?', ['Switzerland', 'Washington', 'California'], 1),
  'memory-17': { question: 'Do you remember how you felt in this moment?' },
  'memory-01': quiz('Where was this?', ['Krakow', 'Ojcow', 'Zakopane'], 1),
  'memory-08': { question: 'Do you remember the breakfast place on this day?' },
  'memory-31': quiz('Will you marry me?', ['Yes', 'No', 'You have reached the voicemail box of Justyna'], 0),
  'memory-29': { question: 'Because whether we go to canyons,' },
  'memory-04': { question: 'or deserts,' },
  'memory-33': { question: 'or exotic monuments,' },
  'memory-20': { question: 'I can’t imagine my life without you.' },
  'memory-14': { question: 'You’ll never cook as well as I do,' },
  'memory-10': { question: 'and I’ll never make desserts as well as you do,' },
  'memory-25': { question: 'so please make me Chmórka.' },
  'memory-28': quiz('Remember this place?', ['Sam Francisco', 'San Diego', 'San Jose'], 1),
  'memory-34': { question: 'You are naturally an art piece,' },
  'memory-09': { question: 'and you light up my world.' },
  'memory-05': { question: 'I should have supported you more during residency,' },
  'memory-22': { question: 'Tulipanowiec.' },
  'memory-21': { question: 'Almost 13 years of fun,' },
  'memory-18': { question: 'and you getting more beautiful,' },
  'memory-35': { question: 'never letting me work,' },
  'memory-07': { question: 'and taking on ambitious goals,' },
  'memory-13': { question: 'Here’s to the next 34 years of success. Happy birthday my love ❤️' },
};

export const memories: BirthdayMemory[] = [
  {"id": "memory-01", "capturedAt": "2017-11-04T13:15:58", "photo": "/justyna34/photos/memory-01.webp", "width": 1350, "height": 1800, "alt": "A couple smiling in front of autumn hills"},
  {"id": "memory-02", "capturedAt": "2016-04-07T17:55:14", "photo": "/justyna34/photos/memory-02.webp", "width": 1800, "height": 1350, "alt": "Two people looking up at the camera from a patterned rug"},
  {"id": "memory-03", "capturedAt": "2014-01-26T13:43:00", "photo": "/justyna34/photos/memory-03.webp", "width": 960, "height": 1280, "alt": "A smiling couple taking a close-up selfie"},
  {"id": "memory-04", "capturedAt": "2019-01-05T16:47:31", "photo": "/justyna34/photos/memory-04.webp", "width": 1350, "height": 1800, "alt": "A woman standing on sunlit sand dunes"},
  {"id": "memory-05", "capturedAt": "2021-11-11T19:40:10", "photo": "/justyna34/photos/memory-05.webp", "width": 1136, "height": 1800, "alt": "Relaxing on a blue sofa at home"},
  {"id": "memory-06", "capturedAt": "2016-06-18T19:35:21", "photo": "/justyna34/photos/memory-06.webp", "video": "/justyna34/photos/memory-06.mp4", "width": 720, "height": 1280, "alt": "A smiling woman sitting at home"},
  {"id": "memory-07", "capturedAt": "2025-07-05T10:57:26", "photo": "/justyna34/photos/memory-07.webp", "width": 1013, "height": 1800, "alt": "A woman by a railing with mountains in the background"},
  {"id": "memory-08", "capturedAt": "2018-02-12T12:25:32", "photo": "/justyna34/photos/memory-08.webp", "width": 1350, "height": 1800, "alt": "A person standing below a snowy mountain peak"},
  {"id": "memory-09", "capturedAt": "2020-09-27T18:13:35", "photo": "/justyna34/photos/memory-09.webp", "width": 1800, "height": 1350, "alt": "Kayaking on a calm lake surrounded by autumn trees"},
  {"id": "memory-10", "capturedAt": "2019-07-03T17:52:02", "photo": "/justyna34/photos/memory-10.webp", "width": 1350, "height": 1800, "alt": "A woman smiling and showing intricate henna on her hand"},
  {"id": "memory-11", "capturedAt": "2015-08-19T17:05:41", "photo": "/justyna34/photos/memory-11.webp", "width": 1350, "height": 1800, "alt": "A woman wearing sunglasses beside a carved stone doorway"},
  {"id": "memory-12", "capturedAt": "2016-08-06T11:39:00", "photo": "/justyna34/photos/memory-12.webp", "width": 1800, "height": 1013, "alt": "A woman smiling on a green mountain hillside"},
  {"id": "memory-13", "capturedAt": "2026-06-05T15:32:57", "photo": "/justyna34/photos/memory-13.webp", "width": 1350, "height": 1800, "alt": "A couple sitting together in front of a mountain"},
  {"id": "memory-14", "capturedAt": "2019-05-18T12:29:11", "photo": "/justyna34/photos/memory-14.webp", "width": 1350, "height": 1800, "alt": "A woman preparing food in a sunlit kitchen"},
  {"id": "memory-15", "capturedAt": "2015-03-16T16:24:03", "photo": "/justyna34/photos/memory-15.webp", "width": 1800, "height": 1350, "alt": "A silhouette on a ridge beneath a clear blue sky"},
  {"id": "memory-16", "capturedAt": "2014-11-09T07:06:37", "photo": "/justyna34/photos/memory-16.webp", "width": 1800, "height": 1350, "alt": "A couple together on a colorful boat"},
  {"id": "memory-17", "capturedAt": "2017-07-21T18:51:40", "photo": "/justyna34/photos/memory-17.webp", "width": 1350, "height": 1800, "alt": "A couple smiling together outdoors"},
  {"id": "memory-18", "capturedAt": "2023-06-17T17:42:47", "photo": "/justyna34/photos/memory-18.webp", "width": 1350, "height": 1800, "alt": "A couple dressed up together in an ornate hall"},
  {"id": "memory-19", "capturedAt": "2016-06-12T20:31:30", "photo": "/justyna34/photos/memory-19.webp", "width": 750, "height": 1334, "alt": "A playful selfie together with an exaggerated face"},
  {"id": "memory-20", "capturedAt": "2019-02-16T11:50:43", "photo": "/justyna34/photos/memory-20.webp", "width": 1350, "height": 1800, "alt": "A woman walking beneath tropical palms"},
  {"id": "memory-21", "capturedAt": "2023-04-10T09:19:56", "photo": "/justyna34/photos/memory-21.webp", "width": 1350, "height": 1800, "alt": "A woman at a viewpoint above a green valley"},
  {"id": "memory-22", "capturedAt": "2022-04-16T13:21:39", "photo": "/justyna34/photos/memory-22.webp", "width": 1350, "height": 1800, "alt": "A woman in a red jacket holding a basket outdoors"},
  {"id": "memory-23", "capturedAt": "2016-07-11T20:20:40", "photo": "/justyna34/photos/memory-23.webp", "width": 750, "height": 1334, "alt": "A playful selfie with an exaggerated face filter"},
  {"id": "memory-24", "capturedAt": "2016-02-06T19:31:01", "photo": "/justyna34/photos/memory-24.webp", "width": 640, "height": 1136, "alt": "A playful selfie with a pink cat filter"},
  {"id": "memory-25", "capturedAt": "2019-10-26T17:41:59", "photo": "/justyna34/photos/memory-25.webp", "width": 1350, "height": 1800, "alt": "A couple smiling together beside the sea at sunset"},
  {"id": "memory-26", "capturedAt": "2016-04-14T09:49:00", "photo": "/justyna34/photos/memory-26.webp", "width": 1024, "height": 683, "alt": "Three people looking out over a snowy glacier lake"},
  {"id": "memory-27", "capturedAt": "2015-11-01T04:44:00", "photo": "/justyna34/photos/memory-27.webp", "width": 1593, "height": 1195, "alt": "Friends posing together on a street at night"},
  {"id": "memory-28", "capturedAt": "2019-10-27T15:38:02", "photo": "/justyna34/photos/memory-28.webp", "width": 1350, "height": 1800, "alt": "A woman beside a palm tree and a timber building"},
  {"id": "memory-29", "capturedAt": "2018-08-18T15:01:34", "photo": "/justyna34/photos/memory-29.webp", "width": 1800, "height": 1350, "alt": "A walk through a lush green ravine"},
  {"id": "memory-30", "capturedAt": "2016-03-24T21:59:36", "photo": "/justyna34/photos/memory-30.webp", "width": 640, "height": 1136, "alt": "A playful portrait with a colorful hat filter"},
  {"id": "memory-31", "capturedAt": "2018-02-13T17:03:20", "photo": "/justyna34/photos/memory-31.webp", "width": 1800, "height": 1350, "alt": "A couple overlooking a colorful seaside village"},
  {"id": "memory-32", "capturedAt": "2016-04-14T09:32:00", "photo": "/justyna34/photos/memory-32.webp", "width": 1800, "height": 1350, "alt": "A skier raising both arms in celebration"},
  {"id": "memory-33", "capturedAt": "2019-01-08T12:06:45", "photo": "/justyna34/photos/memory-33.webp", "width": 1350, "height": 1800, "alt": "A woman standing in an ornate tiled doorway"},
  {"id": "memory-34", "capturedAt": "2020-07-19T20:41:38", "photo": "/justyna34/photos/memory-34.webp", "width": 1350, "height": 1800, "alt": "A woman relaxing on a bed with a green book"},
  {"id": "memory-35", "capturedAt": "2024-03-13T13:42:00", "photo": "/justyna34/photos/memory-35.webp", "width": 1306, "height": 1211, "alt": "Two people together at a desk by a window"},
].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).map(({ capturedAt: _capturedAt, ...memory }) => {
  const copy = birthdayCopy[memory.id];
  if (!copy) throw new Error(`Missing birthday copy for ${memory.id}`);
  return { ...memory, ...copy, options: copy.options ?? [] };
});
