// 氣象署回應的欄位名稱，全部對照 worker/test/fixtures/morning 的真實回應確認過。
//
// 「要用真的授權碼確認的事」的答案：
// 1. 鄉鎮經緯度：F-D0047 每個鄉鎮（Location）底下的 Latitude / Longitude（字串，WGS84 十進位度）。
// 2. 3 天預報氣溫的間隔：1 小時（溫度、露點、相對濕度、體感溫度、舒適度各 56 筆，逐時）；
//    風速、風向、3 小時降雨機率、天氣現象是 3 小時一筆（各 32 筆）。
// 3. 今天累積雨量：用 WeatherElement.Now.Precipitation。氣象署文件沒寫這個欄位的說明，
//    抓到的當天資料全部測站都是 0.0 或 -99（缺值），所以「是當日累積」是依氣象署觀測資料欄位的慣例判斷，
//    還沒有下過雨的資料可以驗證。
//
// 跟預期不同的地方：
// - OBS.coords 指到的是陣列，每筆長這樣：{CoordinateName: 'TWD67' | 'WGS84', StationLatitude, StationLongitude}，
//   要取 CoordinateName === 'WGS84' 那一筆。
// - 觀測值缺值是字串 '-99'，不是 null。
// - SUN 的 CountyName 在 records.locations.location[] 這一層，Date / SunRiseTime / SunSetTime 在它的 time[] 裡。

export const THREE_DAY = {
  temperature: ['溫度', 'Temperature'], apparent: ['體感溫度', 'ApparentTemperature'],
  humidity: ['相對濕度', 'RelativeHumidity'], comfort: ['舒適度指數', 'ComfortIndexDescription'],
  beaufort: ['風速', 'BeaufortScale'], windDirection: ['風向', 'WindDirection'],
  pop: ['3小時降雨機率', 'ProbabilityOfPrecipitation'],
  weather: ['天氣現象', 'Weather'], weatherCode: ['天氣現象', 'WeatherCode'],
};

export const WEEKLY = {
  maxT: ['最高溫度', 'MaxTemperature'], minT: ['最低溫度', 'MinTemperature'],
  maxAT: ['最高體感溫度', 'MaxApparentTemperature'], minAT: ['最低體感溫度', 'MinApparentTemperature'],
  pop: ['12小時降雨機率', 'ProbabilityOfPrecipitation'], humidity: ['平均相對濕度', 'RelativeHumidity'],
  beaufort: ['風速', 'BeaufortScale'], windDirection: ['風向', 'WindDirection'],
  uv: ['紫外線指數', 'UVIndex'], uvLevel: ['紫外線指數', 'UVExposureLevel'],
  weather: ['天氣現象', 'Weather'], weatherCode: ['天氣現象', 'WeatherCode'],
};

// 鄉鎮預報（F-D0047）每個鄉鎮的經緯度欄位
export const TOWN_COORDS = { lat: 'Latitude', lon: 'Longitude' };

// O-A0001-001 每個測站的欄位路徑
export const OBS = {
  name: 'StationName', time: 'ObsTime.DateTime', county: 'GeoInfo.CountyName', town: 'GeoInfo.TownName',
  coords: 'GeoInfo.Coordinates', temperature: 'WeatherElement.AirTemperature', humidity: 'WeatherElement.RelativeHumidity',
  windDirection: 'WeatherElement.WindDirection', windSpeed: 'WeatherElement.WindSpeed',
  pressure: 'WeatherElement.AirPressure', rainToday: 'WeatherElement.Now.Precipitation',
};

// A-B0062-001 的欄位
export const SUN = { county: 'CountyName', date: 'Date', sunrise: 'SunRiseTime', sunset: 'SunSetTime' };
