export type CalculatorActivityType =
  | 'stationary_combustion'
  | 'mobile_combustion'
  | 'purchased_electricity'
  | 'flight'
  | 'hotel'
  | 'rail'
  | 'financed_credit'
  | 'financed_security';

export type CalculatorCalculationMethod =
  | 'fuel_consumption'
  | 'standard_distance'
  | 'user_distance'
  | 'location_based'
  | 'flight_passenger'
  | 'hotel_room_night'
  | 'rail_distance'
  | 'financed_emissions';
