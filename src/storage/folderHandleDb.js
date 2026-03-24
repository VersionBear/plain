import { FOLDER_DB_NAME, FOLDER_HANDLE_KEY, FOLDER_STORE_NAME } from './constants';

function openFolderHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FOLDER_DB_NAME, 1);

    request.addEventListener('upgradeneeded', () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(FOLDER_STORE_NAME)) {
        database.createObjectStore(FOLDER_STORE_NAME);
      }
    });

    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error ?? new Error('Unable to open storage database.')));
  });
}

async function withFolderStore(mode, callback) {
  const database = await openFolderHandleDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE_NAME, mode);
    const store = transaction.objectStore(FOLDER_STORE_NAME);

    transaction.addEventListener('complete', () => {
      database.close();
    });
    transaction.addEventListener('abort', () => {
      reject(transaction.error ?? new Error('Storage transaction was aborted.'));
      database.close();
    });
    transaction.addEventListener('error', () => {
      reject(transaction.error ?? new Error('Storage transaction failed.'));
      database.close();
    });

    Promise.resolve(callback(store)).then(resolve).catch(reject);
  });
}

export async function getStoredFolderHandle() {
  return withFolderStore('readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(FOLDER_HANDLE_KEY);
      request.addEventListener('success', () => resolve(request.result ?? null));
      request.addEventListener('error', () => reject(request.error ?? new Error('Unable to read stored folder handle.')));
    });
  });
}

export async function setStoredFolderHandle(handle) {
  return withFolderStore('readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.put(handle, FOLDER_HANDLE_KEY);
      request.addEventListener('success', () => resolve(handle));
      request.addEventListener('error', () => reject(request.error ?? new Error('Unable to save the folder handle.')));
    });
  });
}

export async function clearStoredFolderHandle() {
  return withFolderStore('readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.delete(FOLDER_HANDLE_KEY);
      request.addEventListener('success', () => resolve());
      request.addEventListener('error', () => reject(request.error ?? new Error('Unable to clear the folder handle.')));
    });
  });
}
