// services/api/responseHandler.ts
export const handleSuccess = (response: any) => {
  // Handle successful API response
  console.log('API call successful', response.data);
  return response.data; // Return the data for further processing
};

export const handleError = (error: any) => {
  // Handle errors globally
  if (error.response) {
    // Server responded with an error status
    console.error('Error response', error.response.data);
    alert(`Error: ${error.response.data.message || 'An error occurred'}`);
  } else if (error.request) {
    // Request was made but no response received
    console.error('Error request', error.request);
    alert('No response from server');
  } else {
    // Other errors
    console.error('Error', error.message);
    alert('An error occurred');
  }
  throw error; // Re-throw the error after handling it
};
