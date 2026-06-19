import fs from 'fs';
import path from 'path';
import LandingWrapper from '@/components/LandingWrapper';

export default function Home() {
  const filePath = path.join(process.cwd(), 'public', 'landing.html');
  let htmlContent = '';
  
  try {
    htmlContent = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error("Could not read landing.html", e);
    return <div>Error loading landing page</div>;
  }

  // Extract body content
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyInner = bodyMatch ? bodyMatch[1] : htmlContent;

  // Remove the script tag so React doesn't complain and we load it manually in LandingWrapper
  bodyInner = bodyInner.replace(/<script src="js\/main\.js"><\/script>/ig, '');



  // Extract CSS links
  const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  let headInner = headMatch ? headMatch[1] : '';
  const links = headInner.match(/<link[^>]*rel="stylesheet"[^>]*>/gi) || [];

  return (
    <LandingWrapper 
      bodyHtml={bodyInner} 
      cssLinks={links.join('\n')} 
    />
  );
}
