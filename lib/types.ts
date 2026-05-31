import type { Recommend } from './config';

export interface MovieFormData {
  title:        string;
  subgenre:     string;
  secondaryTag: string;
  recommend:    Recommend;
  atmosphere:   number | '';
  story:        number | '';
  characters:   number | '';
  pacing:       number | '';
  visuals:      number | '';
  thrill:       number | '';
  sound:        number | '';
  impact:       number | '';
  bonus:        0 | 1;
}

export interface AddMovieResult {
  success: boolean;
  total?:  number;
  error?:  string;
}
