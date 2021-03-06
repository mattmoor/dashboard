/*
Copyright 2019 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { fireEvent, waitForElement } from 'react-testing-library';
import 'jest-dom/extend-expect';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { createIntl } from 'react-intl';
import { TriggerBindingContainer } from './TriggerBinding';
import { renderWithRouter } from '../../utils/test';

const intl = createIntl({
  locale: 'en',
  defaultLocale: 'en'
});

const triggerBindingSimple = {
  apiVersion: 'tekton.dev/v1alpha1',
  kind: 'TriggerBinding',
  metadata: {
    creationTimestamp: '2019-11-19T19:44:43Z',
    name: 'trigger-binding-simple',
    namespace: 'tekton-pipelines',
    uid: '49243595-0c72-11ea-ae12-025000000001'
  },
  spec: {
    params: [
      { name: 'param1', value: '$(body.head_commit.id)' },
      { name: 'param2', value: '$(body.repository.clone_url)' }
    ]
  }
};

const triggerBindingWithLabels = {
  apiVersion: 'tekton.dev/v1alpha1',
  kind: 'TriggerBinding',
  metadata: {
    labels: {
      mylabel: 'foo',
      myotherlabel: 'bar'
    },
    creationTimestamp: '2019-11-21T15:19:18Z',
    generation: 1,
    name: 'trigger-binding-labels',
    namespace: 'tekton-pipelines',
    uid: '49243595-0c72-11ea-ae12-025000002221'
  },
  spec: {
    params: [
      { name: 'paramLabels1', value: '$(body.head_commit.id)' },
      { name: 'paramLabels2', value: '$(body.repository.clone_url)' }
    ]
  }
};

it('TriggerBindingContainer renders', async () => {
  const triggerBindingName = 'bar';
  const match = {
    params: {
      triggerBindingName
    }
  };
  const middleware = [thunk];
  const mockStore = configureStore(middleware);
  const testStore = mockStore({
    namespaces: {
      selected: 'default'
    },
    triggerBindings: {
      byId: {},
      byNamespace: { default: {} },
      errorMessage: null,
      isFetching: false
    }
  });

  const { getByText } = renderWithRouter(
    <Provider store={testStore}>
      <TriggerBindingContainer
        intl={intl}
        match={match}
        fetchTriggerBinding={() => Promise.resolve()}
        error={null}
        loading={false}
      />
    </Provider>
  );
  await waitForElement(() => getByText(`TriggerBinding not available`));
});

it('TriggerBindingContainer toggles between tabs correctly', async () => {
  const match = {
    params: {
      triggerBindingName: 'trigger-binding-simple'
    }
  };

  const middleware = [thunk];
  const mockStore = configureStore(middleware);

  const testStore = mockStore({
    namespaces: {
      selected: 'tekton-pipelines'
    },
    triggerBindings: {
      byId: 'trigger-binding-simple',
      byNamespace: { default: 'tekton-pipelines' },
      errorMessage: null,
      isFetching: false
    }
  });

  const { getByText } = renderWithRouter(
    <Provider store={testStore}>
      <TriggerBindingContainer
        intl={intl}
        match={match}
        error={null}
        fetchTriggerBinding={() => Promise.resolve(triggerBindingSimple)}
        triggerBinding={triggerBindingSimple}
      />
    </Provider>
  );

  await waitForElement(() => getByText('trigger-binding-simple'));

  await waitForElement(() => getByText('Date Created:'));
  let yamlTab = getByText('YAML');
  expect(yamlTab.parentNode.getAttribute('aria-selected')).toBe('false');

  fireEvent.click(yamlTab);
  await waitForElement(() => getByText(/creationTimestamp/i));
  const detailsTab = getByText(/Details/i);
  expect(detailsTab.parentNode.getAttribute('aria-selected')).toBe('false');

  fireEvent.click(detailsTab);
  yamlTab = getByText('YAML');
  expect(yamlTab.parentNode.getAttribute('aria-selected')).toBe('false');
});

it('TriggerBindingContainer handles error state', async () => {
  const match = {
    params: {
      triggerBindingName: 'foo'
    }
  };

  const middleware = [thunk];
  const mockStore = configureStore(middleware);

  const testStore = mockStore({
    namespaces: {
      selected: 'default'
    },
    triggerBindings: {
      byId: {},
      byNamespace: { default: {} },
      errorMessage: 'Error',
      isFetching: false
    }
  });

  const { getByText } = renderWithRouter(
    <Provider store={testStore}>
      <TriggerBindingContainer
        intl={intl}
        match={match}
        error="Error"
        fetchTriggerBinding={() => Promise.resolve()}
      />
    </Provider>
  );
  await waitForElement(() => getByText('Error loading TriggerBinding'));
});

it('TriggerBindingContainer renders details', async () => {
  const match = {
    params: {
      triggerBindingName: 'trigger-binding-simple'
    }
  };

  const middleware = [thunk];
  const mockStore = configureStore(middleware);

  const testStore = mockStore({
    namespaces: {
      selected: 'tekton-pipelines'
    },
    triggerBindings: {
      byId: 'trigger-binding-simple',
      byNamespace: { default: 'tekton-pipelines' },
      errorMessage: null,
      isFetching: false
    }
  });

  const { getByText } = renderWithRouter(
    <Provider store={testStore}>
      <TriggerBindingContainer
        intl={intl}
        match={match}
        error={null}
        fetchTriggerBinding={() => Promise.resolve(triggerBindingSimple)}
        triggerBinding={triggerBindingSimple}
      />
    </Provider>
  );

  await waitForElement(() => getByText('trigger-binding-simple'));
  await waitForElement(() => getByText(/param1/i));
  await waitForElement(() => getByText(/param2/i));
  await waitForElement(() => getByText('$(body.head_commit.id)'));
  await waitForElement(() => getByText('$(body.repository.clone_url)'));
  await waitForElement(() => getByText('tekton-pipelines'));
  await waitForElement(() => getByText('None'));
});

it('TriggerBindingContainer renders YAML', async () => {
  const match = {
    params: {
      triggerBindingName: 'trigger-binding-simple'
    }
  };

  const middleware = [thunk];
  const mockStore = configureStore(middleware);

  const testStore = mockStore({
    namespaces: {
      selected: 'tekton-pipelines'
    },
    triggerBindings: {
      byId: 'trigger-binding-simple',
      byNamespace: { default: 'tekton-pipelines' },
      errorMessage: null,
      isFetching: false
    }
  });

  const { getByText } = renderWithRouter(
    <Provider store={testStore}>
      <TriggerBindingContainer
        intl={intl}
        match={match}
        error={null}
        fetchTriggerBinding={() => Promise.resolve(triggerBindingSimple)}
        triggerBinding={triggerBindingSimple}
      />
    </Provider>
  );

  await waitForElement(() => getByText('trigger-binding-simple'));
  const yamlTab = getByText('YAML');
  fireEvent.click(yamlTab);
  await waitForElement(() => getByText(/creationTimestamp/i));
  await waitForElement(() => getByText(/spec/i));
  await waitForElement(() => getByText(/params/i));
  await waitForElement(() => getByText(/metadata/i));
  await waitForElement(() => getByText(/TriggerBinding/i));
  await waitForElement(() => getByText(/namespace/i));
});

it('TriggerBindingContainer does not render label section if they are not present', async () => {
  const match = {
    params: {
      triggerBindingName: 'trigger-binding-simple'
    }
  };

  const middleware = [thunk];
  const mockStore = configureStore(middleware);

  const testStore = mockStore({
    namespaces: {
      selected: 'tekton-pipelines'
    },
    triggerBindings: {
      byId: 'trigger-binding-simple',
      byNamespace: { default: 'tekton-pipelines' },
      errorMessage: null,
      isFetching: false
    }
  });

  const { getByText } = renderWithRouter(
    <Provider store={testStore}>
      <TriggerBindingContainer
        intl={intl}
        match={match}
        error={null}
        fetchTriggerBinding={() => Promise.resolve(triggerBindingSimple)}
        triggerBinding={triggerBindingSimple}
      />
    </Provider>
  );

  await waitForElement(() => getByText('trigger-binding-simple'));
  await waitForElement(() => getByText('None'));
});

it('TriggerBindingContainer renders labels section if they are present', async () => {
  const match = {
    params: {
      triggerBindingName: 'trigger-binding-labels'
    }
  };

  const middleware = [thunk];
  const mockStore = configureStore(middleware);

  const testStore = mockStore({
    namespaces: {
      selected: 'tekton-pipelines'
    },
    triggerBindings: {
      byId: 'trigger-binding-labels',
      byNamespace: { default: 'tekton-pipelines' },
      errorMessage: null,
      isFetching: false
    }
  });

  const { getByText } = renderWithRouter(
    <Provider store={testStore}>
      <TriggerBindingContainer
        intl={intl}
        match={match}
        error={null}
        fetchTriggerBinding={() => Promise.resolve(triggerBindingWithLabels)}
        triggerBinding={triggerBindingWithLabels}
      />
    </Provider>
  );

  await waitForElement(() => getByText('trigger-binding-labels'));
  await waitForElement(() => getByText(/Labels/i));
  await waitForElement(() => getByText(/mylabel: foo/i));
  await waitForElement(() => getByText(/myotherlabel: bar/i));
});
