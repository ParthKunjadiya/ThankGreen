const formateDateTime = (isoTimestamp) => {
    // Create a Date object from the ISO timestamp and adjust to Indian Standard Time (IST)
    const date = new Date(isoTimestamp);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5.5
    const istDate = new Date(date.getTime() + istOffset);

    // Extract hours, minutes, and seconds
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();

    // Convert hours to 12-hour format and determine AM/PM
    let formattedHours = hours % 12;
    formattedHours = formattedHours === 0 ? 12 : formattedHours; // 12-hour format adjustment
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Extract date components
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');

    // Extract time components
    const formattedHoursStr = String(formattedHours).padStart(2, '0');
    const formattedMinutesStr = String(minutes).padStart(2, '0');

    // Construct the formatted date string
    const formattedDate = `${year}-${month}-${day}`;

    // Construct the formatted date time string
    const formattedDateTime = `${formattedDate} ${formattedHoursStr}:${formattedMinutesStr} ${ampm}`;

    return formattedDateTime;
}

module.exports = {
    formateDateTime
};