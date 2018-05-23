// @flow

import React from 'react';
import firebase from 'firebase';

import PageLayout from '../components/PageLayout';
import MainView from './main';

const config = {
  apiKey: 'AIzaSyDU1s5lf59o7fFjKBPK3KylFXH6QUz8fAo',
  authDomain: 'fir-data-subset-issue.firebaseapp.com',
  databaseURL: 'https://fir-data-subset-issue.firebaseio.com',
  projectId: 'fir-data-subset-issue',
  storageBucket: 'fir-data-subset-issue.appspot.com',
  messagingSenderId: '761487708951',
};

if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

type Props = {
  url: {
    query: {
      log?: mixed,
    },
  },
};

export default class IndexPage extends React.Component<Props> {
  render() {
    const { url } = this.props;
    const logParam = url.query && url.query.log;
    const enableFirebaseLogging = logParam === 'true' || logParam === '1';
    return (
      <PageLayout>
        <MainView enableFirebaseLogging={enableFirebaseLogging} />
      </PageLayout>
    );
  }
};
