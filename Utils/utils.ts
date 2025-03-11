import moment from 'moment';
import 'moment-timezone';
export const formattedTimeString = (time: string) => {
  // Convert the ISO string time to a JavaScript Date object

  const localTime = moment.utc(time).local(); // This converts the UTC time to local time

  // Get the current date
  const currentDate = moment().local();

  // Helper function to check if the date is today
  const isToday = (date: moment.Moment) => {
    return date.isSame(currentDate, 'day');
  };

  // Helper function to check if the date is yesterday
  const isYesterday = (date: moment.Moment) => {
    return date.isSame(currentDate.clone().subtract(1, 'day'), 'day');
  };

  // Format the date based on the conditions
  let formattedTime = '';
  if (isToday(localTime)) {
    // Show time if it's today
    formattedTime = localTime.format('h:mm A'); // Example: 5:57 AM
  } else if (isYesterday(localTime)) {
    // Show "Yesterday" if it's yesterday
    formattedTime = 'Yesterday';
  } else {
    // Show the date in DD/MM/YYYY format for other days
    formattedTime = localTime.format('DD/MM/YYYY');
  }
  return formattedTime;
};
