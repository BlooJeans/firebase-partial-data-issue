// @flow

import React from 'react';
import firebase from 'firebase';

type FirebaseQuery = any;
type FirebaseSnapshot = any;

const folderId = 'folderB';
const itemId = 'itemC';

// function getParameter(paramName) {
//   var searchString = global.location.search.substring(1),
//       i, val, params = searchString.split("&");

//   for (i=0;i<params.length;i++) {
//     val = params[i].split("=");
//     if (val[0] == paramName) {
//       return val[1];
//     }
//   }
//   return null;
// }

type MainViewProps = {
  enableFirebaseLogging: boolean,
};
type MainViewState = {
  isShowingSubView: boolean,
  autoEdit: boolean,
  loadedItems: Array<Object>,
};
export default class MainView extends React.Component<MainViewProps, MainViewState> {
  constructor(props: MainViewProps) {
    super(props);

    if (props.enableFirebaseLogging) {
			firebase.database.enableLogging(true);
		}

    this.state = {
      isShowingSubView: false,
      autoEdit: true,
      loadedItems: [],
    };
  }

  componentDidMount() {
    setTimeout(() => {
      console.log('opening subview');
      this.setState({
        isShowingSubView: true,
      });
    }, 750);
  }

  componentWillUnmount() {
    console.log('MainView componentWillUnmount');
  }

  onDoneEditing = () => {
    console.log('closing subview');
    this.setState({
      isShowingSubView: false,
      autoEdit: false,
    }, () => {
      console.log('reopening subview');
      this.setState({
        isShowingSubView: true,
      });
    });
  };


  onItemLoaded = (item: mixed) => {
    console.log('onItemLoaded()', item);
    if (Object.keys(item).length < 2) {
      // item is a subset of the full object, only containing the property/ies that I set in the update()
      console.error('Loaded item doesnt have all the keys it should; ', item);
    }

    this.setState(prevState => {
      return {
        ...prevState,
        loadedItems: [...this.state.loadedItems, item],
      };
    });
  }

  getPinnedQuery = () => {
    // this query must return 0 items for the bug to occur
    return firebase.database().ref('/firebaseIssueTest').orderByChild('isPinned').equalTo(true);
  };

  getPagingQuery = () => {
    return firebase.database().ref('/firebaseIssueTest').limitToLast(15);
  };

  render() {
    return (
      <div>
        {true && (
          <FirebaseGenericLoader
            name="pinned"
            getFirebaseQuery={this.getPinnedQuery}
          />
        )}

        {true && (
          <FirebaseGenericLoader
            name="paging"
            getFirebaseQuery={this.getPagingQuery}
          />
        )}

        {this.state.isShowingSubView ? (
          <SubView
            onDoneEditing={this.onDoneEditing}
            autoEdit={this.state.autoEdit}
            onItemLoaded={this.onItemLoaded}
          />
        ) : null}

        <h4>View the console to see the events</h4>
        <div>
          <a href="?log=true">Enable Firebase Logging</a><br />
          <a href="?log=false">Disable Firebase Logging</a>
        </div>

        {this.state.loadedItems.map((item, index) => {
          return (
            <React.Fragment key={'item'+index}>
              <h3>Loaded Item {index+1}</h3>
              <pre>{JSON.stringify(item)}</pre>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}


type SubViewProps = {
  autoEdit: boolean,
  onItemLoaded: (item: mixed) => void,
  onDoneEditing: () => void,
};
class SubView extends React.Component<SubViewProps> {
  ref: ?any;
  fired: boolean;

  componentDidMount() {
    this.fired = false;
    this.init();
  }

  componentWillUnmount() {
    console.log('SubView.componentWillUnmount()');
    this.removeLiveData();
  }

  init() {
    console.log('SubView.init(); adding item.on(value)');
    this.removeLiveData();
    this.ref = firebase.database().ref(`/firebaseIssueTest/${folderId}/${itemId}`);
    this.ref &&
      this.ref.on('value', this.onValue, err => {
        console.log('SubView onError: ', err);
      });
  }

  removeLiveData() {
    if (this.ref) {
      console.log('SubView.removeLiveData() removing ref.value');
      this.ref.off('value', this.onValue);
    }
  }


  onValue = (snapshot: any) => {
    const value = (snapshot.val(): any);

    const item = value || {};
    this.props.onItemLoaded(item);

    if (this.props.autoEdit && !this.fired) {
      this.fired = true;
      setTimeout(() => {
        if (this.props.autoEdit) {
          this.doUpdate();
        }
      }, 50);
    }
  };

  doUpdate = () => {
    const itemPath = `/firebaseIssueTest/${folderId}/${itemId}`;
    const itemRef = firebase.database().ref(itemPath);

    const updates = {
      name: 'timestamp: '+Date.now(),
    };
    console.log('Calling item.update() with', updates);

    itemRef.update(updates).then(() => {
      this.props.onDoneEditing();
    });
  };

  render() {
    return null;
  }
}

type FirebaseProps = {
  name: string,
  getFirebaseQuery: () => ?FirebaseQuery,
};
class FirebaseGenericLoader extends React.Component<FirebaseProps> {
  query: ?FirebaseQuery;

  componentDidMount() {
    this.addDataListeners(this.props);
  }

  componentWillUnmount() {
    this.removeDataListeners();
  }

  addDataListeners(props: FirebaseProps) {
    console.log('FirebaseLoader.addDataListeners', this.props.name);

    this.removeDataListeners();

    this.query = this.props.getFirebaseQuery && this.props.getFirebaseQuery();
    if (!this.query) {
      throw new Error('Invalid getFirebaseQuery');
    }
    this.query.on('value', this.onValue)
  }

  removeDataListeners() {
    if (this.query) {
      console.log('FirebaseLoader.removeDataListeners()');
      this.query.off('value', this.onValue);
    }
  }

  onValue = (snapshot: FirebaseSnapshot) => {
    console.log('FirebaseLoader.onValue()', this.props.name, snapshot.val());
  }

  render() {
    return null;
  }
}

