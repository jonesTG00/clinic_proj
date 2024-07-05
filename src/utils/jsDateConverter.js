module.exports = (jsTimestamp) => {
  const currentDate = new Date(jsTimestamp);
  currentDate.setHours(currentDate.getHours() + 8);
  console.log(currentDate);
  const mysqlDatetime = currentDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  return mysqlDatetime;
};
