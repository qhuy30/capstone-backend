function convertTimestampToDate(timestamp) {
    const date = new Date(timestamp);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayOfWeek = dayNames[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const formattedDate = `${dayOfWeek} ${day}/${month}/${year}`;

    return formattedDate;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    // Format the date as "dd/mm/yyyy"
    const formattedDate = `${day}/${month}/${year}`;

    return formattedDate;
}

function isDateInRange(startDate, endDate, checkDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const check = new Date(checkDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    check.setHours(0, 0, 0, 0);
    return check >= start && check <= end;
}

function generateCalendar(start_date, end_date, events){
    const calendarDates = [];
    let currentDate = start_date;
    while (currentDate <= end_date) {
        const eventDay = events
                    .filter(event => isDateInRange(new Date(event.start_date), new Date(event.end_date), currentDate))
                    .map(event =>({
                        ...event,
                        ...generate_textEvent(event, new Date(currentDate))
                    }))
                    .sort((a, b) => a.start_date - b.start_date);
        calendarDates.push({
          value: new Date(currentDate),
          events: [...eventDay],
          ...getDateParts(currentDate)
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return calendarDates;
}

function getDateParts(date) {
    const today = new Date();
    const day = date.getDate().toString().padStart(2, '0');   // Lấy ngày theo múi giờ địa phương
    const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Lấy tháng theo múi giờ địa phương (cộng thêm 1)
    const year = date.getFullYear();  // Lấy năm theo múi giờ địa phương
    const weekDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const isToday = (
      day === today.getDate().toString().padStart(2, '0') &&
      month === (today.getMonth() + 1).toString().padStart(2, '0') &&
      year === today.getFullYear()
    );
    return {
        day,
        month,
        year,
        weekDay,
        isToday
    };
}

function compareDate(date1,date2) {
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);
    return Math.sign(d1 - d2);
}

function generate_textEvent(event, day){
    let compareToStartDate = compareDate(day, event.start_date);
    let compareToEndDate = compareDate(day, event.end_date);
    let start_time_event = '';
    let end_time_event = '';
    if(compareToStartDate === 1 && compareToEndDate === -1){
        start_time_event = '07:00';
        end_time_event = '17:00';
    }

    if(compareToStartDate === 1 && compareToEndDate === 0){
        const endTime = new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        // text_time_event = `Early in the day' - ${endTime}`
        start_time_event = '07:00';
        end_time_event = endTime;
    }

    if(compareToStartDate === 0 && compareToEndDate === -1){
        const startTime = new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        // text_time_event = `${startTime} - Until the end of the day`
        start_time_event = startTime;
        end_time_event = '17:00';
    }

    if(compareToStartDate === 0 && compareToEndDate === 0){
        const startTime = new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        start_time_event = startTime;
        end_time_event = endTime;
    }
    return {start_time_event, end_time_event};
}

module.exports = {
    convertTimestampToDate,
    formatTimestamp,
    generateCalendar
};
