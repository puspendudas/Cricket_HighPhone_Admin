import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client';
import { Suspense, StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from './app';
import { store } from './store/store';
import { CONFIG } from './config-global';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter basename={CONFIG.site.basePath}>
          <Suspense>
            <App />
          </Suspense>
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </StrictMode>
);
