import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import appRouter from './routing/Routing';
import { store } from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={appRouter} />
      <ToastContainer />
    </Provider>
  );
}

export default App;
