const fs = require('fs');

try {
  let html = fs.readFileSync('C:/Users/monep/OneDrive/Desktop/Tous mes dossiers/PROJET WEB/Fotodesk/index.html', 'utf8');

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : html;

  bodyContent = bodyContent.replace(/<script src="js\/main\.js"><\/script>/ig, '');

  const reactCode = `
"use client";

import React, { useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LandingPage() {
  useEffect(() => {
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
      
      <div className="landing-wrapper">
        <div className="fixed top-4 right-4 z-[9999]">
           <ThemeToggle />
        </div>
        <div dangerouslySetInnerHTML={{ __html: \`${bodyContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
      </div>
    </>
  );
}
`;

  fs.writeFileSync('C:/Users/monep/OneDrive/Desktop/Tous mes dossiers/PROJET WEB/fotodesk/src/app/page.tsx', reactCode);
  console.log('Successfully wrote page.tsx');
} catch (error) {
  console.error(error);
}
