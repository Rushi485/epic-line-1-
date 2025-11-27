import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Album, AlbumContextType, Photo } from '../types';
import { INITIAL_ALBUMS } from '../constants';

const AppContext = createContext<AlbumContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);

  const addPhotoToAlbum = (albumId: string, photo: Photo) => {
    setAlbums(prev => prev.map(album => {
      if (album.id === albumId) {
        return { ...album, photos: [...album.photos, photo] };
      }
      return album;
    }));
  };

  const addPhotosToAlbum = (albumId: string, newPhotos: Photo[]) => {
    setAlbums(prev => prev.map(album => {
      if (album.id === albumId) {
        return { ...album, photos: [...album.photos, ...newPhotos] };
      }
      return album;
    }));
  };

  const deletePhotosFromAlbum = (albumId: string, photoIds: string[]) => {
    setAlbums(prev => prev.map(album => {
      if (album.id === albumId) {
        return { 
          ...album, 
          photos: album.photos.filter(p => !photoIds.includes(p.id)) 
        };
      }
      return album;
    }));
  };

  const getAlbum = (id: string) => albums.find(a => a.id === id);

  return (
    <AppContext.Provider value={{ albums, addPhotoToAlbum, addPhotosToAlbum, deletePhotosFromAlbum, getAlbum }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};