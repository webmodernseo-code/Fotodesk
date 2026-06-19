"use client";

import React, { useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LandingWrapper({ bodyHtml, cssLinks }: { bodyHtml: string, cssLinks: string }) {
  useEffect(() => {
    // Load the main.js script dynamically so it executes
    const script = document.createElement('script');
    script.src = '/js/main.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/css/variables.css" />
      <link rel="stylesheet" href="/css/base.css" />
      <link rel="stylesheet" href="/css/components.css" />
      <link rel="stylesheet" href="/css/sections.css" />
      <link rel="stylesheet" href="/css/responsive.css" />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
