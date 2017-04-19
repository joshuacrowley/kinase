/* global chrome */

import promiseMiddleware from 'redux-promise';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { alias, wrapStore } from 'react-chrome-redux';

import aliases from 'redux/aliases';
import main from 'redux/reducers/main';
import { PORT_NAME } from 'redux/constants';

const store = createStore(
  main,
  applyMiddleware(
    alias(aliases),
    thunk,
    promiseMiddleware,
  ),
);
wrapStore(store, { portName: PORT_NAME });

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.executeScript(null, {
    file: 'dist/main.js',
  });
});
