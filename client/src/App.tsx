import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import appRouter from './routing/Routing';
import { store } from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={appRouter} />
    </Provider>
  );
}

export default App;
