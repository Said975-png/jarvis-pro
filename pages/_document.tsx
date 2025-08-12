import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ru">
      <Head>

        {/* Скрипт защиты от просмотра кода */}
        <script src="/protection.js" />

        {/* Встроенная защита */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Немедленная блокировка правой кнопки мыши
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }, true);
              
              // Блокировка DevTools
              document.addEventListener('keydown', function(e) {
                if (e.keyCode === 123 || 
                    (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 67 || e.keyCode === 74)) ||
                    (e.ctrlKey && e.keyCode === 85)) {
                  e.preventDefault();
                  return false;
                }
              }, true);
              
              // Отключение выделения
              document.onselectstart = function() { return false; };
              document.ondragstart = function() { return false; };
              document.oncontextmenu = function() { return false; };
            `,
          }}
        />
        
        {/* Мета теги для защиты */}
        <meta name="referrer" content="no-referrer" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
