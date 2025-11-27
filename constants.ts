import { Album } from './types';

export const ARTIST_NAME = "RUSHIKESH";
export const HERO_SUBTITLE = "From 1999 to 2025";
export const HERO_QUOTE = "Photography is the story I fail to put into words.";

// YouTube Video ID (Extracted from: https://youtu.be/OubcGBmaKiQ)
// This is a cinematic video background.
export const HERO_YOUTUBE_ID = "OubcGBmaKiQ";

// Initial Mock Data - Empty Albums for User Upload
export const INITIAL_ALBUMS: Album[] = [
  {
    id: "s1",
    title: "Nature's Whisper",
    subtitle: "Landscapes & Solitude",
    description: "A collection of moments where silence speaks louder than words. Captured across the valleys of the Himalayas.",
    coverPhotoId: "",
    photos: []
  },
  {
    id: "s2",
    title: "Urban Echoes",
    subtitle: "City Lights & Shadows",
    description: "Exploring the chaotic beauty of modern metropolises. The interplay of light, architecture, and human life.",
    coverPhotoId: "",
    photos: []
  },
  {
    id: "s3",
    title: "Portraits of Soul",
    subtitle: "Faces & Stories",
    description: "Every face has a story to tell. This album focuses on the raw emotion and unscripted moments of people.",
    coverPhotoId: "",
    photos: []
  }
];