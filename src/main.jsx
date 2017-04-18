/* global document, HTMLImageElement */

import filter from 'lodash.filter';
import isNil from 'lodash.isnil';
import trim from 'lodash.trim';
import React from 'react';
import ReactDOM from 'react-dom';
import CssSelectorGenerator from 'css-selector-generator';
import { Provider } from 'react-redux';
import { Store } from 'react-chrome-redux';

import Highlighter from 'highlighter';
import Sidebar from 'components/Sidebar';
import styles from 'main.scss';
import { PORT_NAME } from 'redux/constants';
import { selectElement } from 'redux/proxyActions';
import { currentFieldTypeSelector } from 'redux/selectors';

const selectorGenerator = new CssSelectorGenerator({
  // TODO(jrbotros): Exclude specific classes (e.g., `tether-*`) but allow others
  selectors: ['id', 'tag', 'nthchild'],
});

if (!document.querySelector(styles.tentMain)) {
  const store = new Store({
    portName: PORT_NAME,
  });

  const getWrappedText = (node) => {
    const textNodes = filter(
      node.childNodes, child => child.nodeType === child.TEXT_NODE);
    const combined = trim(
      textNodes.map(textNode => textNode.textContent).join(''));
    return combined || null;
  };

  const getWrappedImage = node => (
    node instanceof HTMLImageElement && node.src ? node.src : null);

  const getWrappedContent = (node) => {
    switch (currentFieldTypeSelector(store.getState())) {
      case 'text':
        return getWrappedText(node);
      case 'image':
        return getWrappedImage(node);
      default:
        return null;
    }
  };


  const mainContainer = document.createElement('div');
  mainContainer.setAttribute('class', styles.tentMain);
  mainContainer.innerHTML = document.body.innerHTML;

  const sidebarContainer = document.createElement('div');
  sidebarContainer.setAttribute('class', styles.tentSidebar);
  document.body.innerHTML = mainContainer.outerHTML;

  // Wrap extension interface in a shadow root to sandbox styles
  const sidebarShadow = sidebarContainer.attachShadow({ mode: 'open' });

  document.body.appendChild(sidebarContainer);

  /**
   * Copy all custom styles into shadow DOM
   * TODO(jrbotros): Separate interface styles from external styles in build
   */
  document.querySelectorAll('.bundled-styles')
    .forEach((style) => {
      sidebarShadow.appendChild(style.cloneNode(true));
    });

  // Set up main interface container inside shadow root
  const reactRoot = sidebarShadow.appendChild(document.createElement('div'));

  // Prevent inheriting styles from parent elements
  reactRoot.style.all = 'initial';

  const highlighter = new Highlighter();
  document.querySelector(`.${styles.tentMain}`)
    .addEventListener('mouseover', (event) => {
      if (getWrappedContent(event.target)) {
        highlighter.highlight(event.target);
      }
    });

  document.querySelector(`.${styles.tentMain}`)
    .addEventListener('click', (event) => {
      const content = getWrappedContent(event.target);
      if (!isNil(content)) {
        const selector = selectorGenerator.getSelector(event.target);
        store.dispatch(selectElement(selector, content));
      }
    });

  store.ready().then(() => {
    ReactDOM.render(
      <Provider store={store}>
        <Sidebar />
      </Provider>,
      reactRoot);
  });
}