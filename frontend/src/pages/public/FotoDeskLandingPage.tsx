import React, { useEffect, useState } from 'react';

export function FotoDeskLandingPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    // Fetch landing.html from public
    fetch('/landing.html')
      .then((res) => res.text())
      .then((html) => {
        // Extract body content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        let content = bodyMatch ? bodyMatch[1] : html;
        // Clean out script tags
        content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Replace /login with /admin/login
        content = content.replace(/href="\/login"/g, 'href="/admin/login"');
        content = content.replace(/href="\/register"/g, 'href="/admin/login"');
        setHtmlContent(content);
      })
      .catch((err) => console.error('Error loading landing page', err));
  }, []);

  useEffect(() => {
    if (!htmlContent) return;

    // Ensure all reveal elements are visible immediately
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('revealed'));

    // Inject CSS files if not already loaded
    const cssFiles = [
      '/css/variables.css',
      '/css/base.css',
      '/css/components.css',
      '/css/sections.css',
      '/css/responsive.css',
    ];

    cssFiles.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Check if main.js is already present
    if (document.querySelector('script[src="/js/main.js"]')) {
      if (typeof (window as any).initAll === 'function') {
        (window as any).initAll();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = '/js/main.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).initAll === 'function') {
        (window as any).initAll();
      }
    };
    document.body.appendChild(script);
  }, [htmlContent]);

  return (
    <div className="fotodesk-landing-container bg-black min-h-screen text-white">
      {htmlContent ? (
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      ) : (
        <div className="flex items-center justify-center min-h-screen text-neutral-400">
          Chargement de FotoDesk...
        </div>
      )}
    </div>
  );
}
