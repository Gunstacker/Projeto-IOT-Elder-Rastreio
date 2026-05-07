function nowIso() {
  return new Date().toISOString();
}

function toIso(value) {
  if (!value) {
    return nowIso();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
}

function ageInMs(isoDate) {
  if (!isoDate) {
    return Infinity;
  }

  const time = new Date(isoDate).getTime();
  return Number.isNaN(time) ? Infinity : Date.now() - time;
}

module.exports = {
  nowIso,
  toIso,
  ageInMs
};
