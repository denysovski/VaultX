// Every photo here is by Christian Agbede, published free on Unsplash.
// https://unsplash.com/@chriscreations__
export const PHOTOGRAPHER = {
  name: 'Christian Agbede',
  url: 'https://unsplash.com/@chriscreations__?utm_source=vaultx&utm_medium=referral',
};

export interface Look {
  key: string;
  alt: string;
  caption: string;
  unsplash: string;
}

export const LOOKS: Look[] = [
  { key: 'yellow-sky', alt: 'Woman in a yellow puff-sleeve dress against a bright blue sky', caption: 'Noon, rooftop 14', unsplash: 'https://unsplash.com/photos/aqLw4av7NNM' },
  { key: 'scarf', alt: 'Young man in a white shirt with a printed scarf, looking into the camera', caption: 'Sector 3, after the rain', unsplash: 'https://unsplash.com/photos/ROmQBWVwEls' },
  { key: 'car', alt: 'Woman in black posing in the back seat of a dark car', caption: 'Back seat, 02:40', unsplash: 'https://unsplash.com/photos/50M2OkPKHdY' },
  { key: 'concert', alt: 'Crowd at a concert holding up phones to take photos', caption: 'The bloc, Saturday', unsplash: 'https://unsplash.com/photos/MCEIUEsj918' },
  { key: 'rings', alt: 'Close-up of a woman in a black shirt wearing silver rings and a necklace', caption: 'Hardware', unsplash: 'https://unsplash.com/photos/JiKUrya050w' },
  { key: 'suit', alt: 'Man in a dark suit with his hands on his face against a red wall', caption: 'Interrogation room', unsplash: 'https://unsplash.com/photos/ONcme2-tWTs' },
  { key: 'orange-dress', alt: 'Woman in a bright orange dress holding oranges at a market', caption: 'Ration day', unsplash: 'https://unsplash.com/photos/AvNRrrZjNaI' },
  { key: 'market-crates', alt: 'Woman in a yellow dress posing at a market with stacked pink crates', caption: 'Supply line', unsplash: 'https://unsplash.com/photos/ssTQhwslygs' },
  { key: 'reading', alt: 'Woman in an orange dress reading a magazine in a busy market', caption: 'Rush hour, sector 9', unsplash: 'https://unsplash.com/photos/Yp_haKwhKc0' },
  { key: 'market-veg', alt: 'Woman in a yellow dress posing among fresh vegetables at an outdoor market', caption: 'Green zone', unsplash: 'https://unsplash.com/photos/lZpFUKTC0VQ' },
  { key: 'offshoulder', alt: 'Woman in a yellow off-the-shoulder dress at a fruit market stall', caption: 'Under the canopy', unsplash: 'https://unsplash.com/photos/xjNQnmNQAQE' },
  { key: 'holding-orange', alt: 'Woman in a yellow dress holding an orange at a produce market', caption: 'Last orange', unsplash: 'https://unsplash.com/photos/yDwkENz3DRo' },
  { key: 'oranges-stall', alt: 'Woman in a yellow dress holding oranges at a market stall', caption: 'Stall 41', unsplash: 'https://unsplash.com/photos/4wdXcijtVPc' },
  { key: 'cover-face', alt: 'Woman in a yellow dress covering her face at a vegetable market', caption: 'No cameras', unsplash: 'https://unsplash.com/photos/03mrPUPguNU' },
  { key: 'produce', alt: 'Woman in a yellow dress posing among fresh produce at a market', caption: 'Market hours', unsplash: 'https://unsplash.com/photos/vqvoACWLNQY' },
];

export const getLook = (key: string) => LOOKS.find((l) => l.key === key)!;
