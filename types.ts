export interface Photo {
  id: string;
  url: string;
  caption: string; // AI Generated
  location: string; // AI Generated
  date: string;
}

export interface Album {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverPhotoId: string;
  photos: Photo[];
}

export interface AlbumContextType {
  albums: Album[];
  addPhotoToAlbum: (albumId: string, photo: Photo) => void;
  addPhotosToAlbum: (albumId: string, photos: Photo[]) => void;
  deletePhotosFromAlbum: (albumId: string, photoIds: string[]) => void;
  getAlbum: (id: string) => Album | undefined;
}