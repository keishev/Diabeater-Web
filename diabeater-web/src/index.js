import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrashAlt, faEdit, faPlus, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'; 


library.add(faTrashAlt, faEdit, faPlus, faChevronUp, faChevronDown);
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


reportWebVitals();
