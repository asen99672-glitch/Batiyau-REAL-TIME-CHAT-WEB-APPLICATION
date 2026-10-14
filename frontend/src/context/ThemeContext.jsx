import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const PRESET_WALLPAPERS = [
  {
    id: 'heritage-palace',
    name: 'Golden Palace',
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'sunset-mountain',
    name: 'Mountain Sunset',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'dark-minimal',
    name: 'Dark Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'pink-petals',
    name: 'Pink Peonies',
    url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'purple-silk',
    name: 'Purple Silk',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'minimal-palm',
    name: 'Minimal Palm',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'warm-floral',
    name: 'Warm Floral',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'dandelion-dream',
    name: 'Dandelion Macro',
    url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'purple-fig',
    name: 'Dark Fig',
    url: 'https://images.unsplash.com/photo-1574684033282-55db0dfbdad9?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1574684033282-55db0dfbdad9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'orange-tulips',
    name: 'Orange Tulips',
    url: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'amber-silk',
    name: 'Amber Draped Silk',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'retro-pink',
    name: 'Retro Glasses Pink',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'green-ribbon',
    name: 'Emerald Ribbon',
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'blue-waves',
    name: 'Blue Abstract Fluid',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'macarons-green',
    name: 'Green Macarons',
    url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'cyan-ink',
    name: 'Cyan Ink Fluid',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'geometric-blue',
    name: 'Geometric Blue',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'ocean-beach',
    name: 'Turquoise Beach Shore',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'football-pitch',
    name: 'Green Field Grass',
    url: 'https://images.unsplash.com/photo-1529900245534-47fbf822155a?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1529900245534-47fbf822155a?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'dark-waves',
    name: 'Dark Wave Texture',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  },
];

export const ThemeProvider = ({ children }) => {
  // 'light' | 'dark' | 'default'
  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem('chatapp_theme_mode') || 'default';
  });

  const [wallpaper, setWallpaperState] = useState(() => {
    return localStorage.getItem('chatapp_theme_wallpaper') || '';
  });

  const [solidColor, setSolidColorState] = useState(() => {
    const val = localStorage.getItem('chatapp_solid_color') || '';
    if (val === '#111b21') {
      localStorage.removeItem('chatapp_solid_color');
      return '';
    }
    return val;
  });

  const [bubbleColor, setBubbleColorState] = useState(() => {
    const val = localStorage.getItem('chatapp_bubble_color') || '';
    if (val === '#005c4b') {
      localStorage.removeItem('chatapp_bubble_color');
      return '';
    }
    return val;
  });

  const [doodlesEnabled, setDoodlesEnabledState] = useState(() => {
    const val = localStorage.getItem('chatapp_doodles_enabled');
    return val !== null ? val === 'true' : false;
  });

  const [activeThemeId, setActiveThemeIdState] = useState(() => {
    return localStorage.getItem('chatapp_active_theme_id') || 'native';
  });

  const [wallpaperDim, setWallpaperDimState] = useState(() => {
    const v = localStorage.getItem('chatapp_wallpaper_dim');
    return v !== null ? parseFloat(v) : 0.15;
  });

  const [wallpaperBlur, setWallpaperBlurState] = useState(() => {
    const v = localStorage.getItem('chatapp_wallpaper_blur');
    return v !== null ? parseInt(v, 10) : 0;
  });

  // Effective theme: 'dark' only if mode is 'dark', otherwise 'light'
  const effectiveTheme = themeMode === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.body.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // Sync custom BaatCheet Bubble color to CSS variable --message-sent (only if explicitly set)
  useEffect(() => {
    if (bubbleColor) {
      document.documentElement.style.setProperty('--message-sent', bubbleColor);
      document.body.style.setProperty('--message-sent', bubbleColor);
    } else {
      document.documentElement.style.removeProperty('--message-sent');
      document.body.style.removeProperty('--message-sent');
    }
  }, [bubbleColor, effectiveTheme]);

  // Switching theme mode applies the exact authentic theme (Dark = Image 1, Light = Image 2)
  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('chatapp_theme_mode', mode);

    // Clear custom overrides so the pure theme from Image 1 or Image 2 displays
    setWallpaperState('');
    localStorage.removeItem('chatapp_theme_wallpaper');
    setSolidColorState('');
    localStorage.removeItem('chatapp_solid_color');
    setBubbleColorState('');
    localStorage.removeItem('chatapp_bubble_color');
    setDoodlesEnabledState(false);
    localStorage.removeItem('chatapp_doodles_enabled');
    setActiveThemeIdState(mode === 'dark' ? 'dark-native' : 'light-native');
    localStorage.setItem('chatapp_active_theme_id', mode === 'dark' ? 'dark-native' : 'light-native');
  };

  const setCustomWallpaper = (urlOrBase64) => {
    setWallpaperState(urlOrBase64);
    setSolidColorState('');
    localStorage.removeItem('chatapp_solid_color');
    try {
      localStorage.setItem('chatapp_theme_wallpaper', urlOrBase64);
    } catch (e) {
      console.warn('Could not save wallpaper to localStorage:', e);
    }
  };

  const removeWallpaper = () => {
    setWallpaperState('');
    localStorage.removeItem('chatapp_theme_wallpaper');
  };

  const setSolidColor = (color) => {
    setSolidColorState(color);
    removeWallpaper();
    if (color) {
      localStorage.setItem('chatapp_solid_color', color);
    } else {
      localStorage.removeItem('chatapp_solid_color');
    }
  };

  const setBubbleColor = (color) => {
    setBubbleColorState(color);
    if (color) {
      localStorage.setItem('chatapp_bubble_color', color);
    } else {
      localStorage.removeItem('chatapp_bubble_color');
    }
  };

  const resetBubbleColor = () => {
    setBubbleColorState('');
    localStorage.removeItem('chatapp_bubble_color');
  };

  const setDoodlesEnabled = (enabled) => {
    setDoodlesEnabledState(enabled);
    localStorage.setItem('chatapp_doodles_enabled', enabled ? 'true' : 'false');
  };

  // Applying a theme preset in Chat Theme (user custom comfort zone)
  const applyTheme = (theme) => {
    if (!theme) return;
    setActiveThemeIdState(theme.id);
    localStorage.setItem('chatapp_active_theme_id', theme.id);

    if (theme.wallpaper) {
      setCustomWallpaper(theme.wallpaper);
    } else {
      removeWallpaper();
    }

    if (theme.solidColor) {
      setSolidColorState(theme.solidColor);
      localStorage.setItem('chatapp_solid_color', theme.solidColor);
    } else {
      setSolidColorState('');
      localStorage.removeItem('chatapp_solid_color');
    }

    if (theme.bubbleColor) {
      setBubbleColor(theme.bubbleColor);
    } else {
      resetBubbleColor();
    }

    if (typeof theme.doodlesEnabled === 'boolean') {
      setDoodlesEnabled(theme.doodlesEnabled);
    }
  };

  // Reset back to authentic theme (Dark = Image 1, Light = Image 2)
  const resetAllThemeCustomizations = () => {
    removeWallpaper();
    setSolidColorState('');
    localStorage.removeItem('chatapp_solid_color');
    setBubbleColorState('');
    localStorage.removeItem('chatapp_bubble_color');
    setDoodlesEnabledState(false);
    localStorage.removeItem('chatapp_doodles_enabled');
    setActiveThemeIdState(effectiveTheme === 'dark' ? 'dark-native' : 'light-native');
    localStorage.setItem('chatapp_active_theme_id', effectiveTheme === 'dark' ? 'dark-native' : 'light-native');
    setWallpaperDimState(0.15);
    setWallpaperBlurState(0);
  };

  const setWallpaperDim = (dim) => {
    setWallpaperDimState(dim);
    localStorage.setItem('chatapp_wallpaper_dim', dim.toString());
  };

  const setWallpaperBlur = (blur) => {
    setWallpaperBlurState(blur);
    localStorage.setItem('chatapp_wallpaper_blur', blur.toString());
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        effectiveTheme,
        wallpaper,
        setCustomWallpaper,
        removeWallpaper,
        solidColor,
        setSolidColor,
        bubbleColor,
        setBubbleColor,
        resetBubbleColor,
        doodlesEnabled,
        setDoodlesEnabled,
        activeThemeId,
        applyTheme,
        resetAllThemeCustomizations,
        wallpaperDim,
        setWallpaperDim,
        wallpaperBlur,
        setWallpaperBlur,
        presets: PRESET_WALLPAPERS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
