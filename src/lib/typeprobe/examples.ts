// Curated JSON samples shaped like real API responses.
// Each is a static string so the demo never touches the network.
// The shapes are chosen to exercise the inferrer: nullable fields,
// nested objects, numeric arrays, and arrays of objects with varying keys.

export interface Example {
  id: string;
  label: string;
  json: string;
}

const githubUser = {
  login: 'octocat',
  id: 583231,
  node_id: 'MDQ6VXNlcjU4MzIzMQ==',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  type: 'User',
  site_admin: false,
  name: 'The Octocat',
  company: null,
  blog: 'https://github.blog',
  location: 'San Francisco',
  email: null,
  hireable: null,
  bio: null,
  public_repos: 8,
  public_gists: 8,
  followers: 9999,
  following: 9,
  created_at: '2011-01-25T18:44:36Z',
};

const weather = {
  location: {
    name: 'Prague',
    country: 'CZ',
    lat: 50.08,
    lon: 14.44,
  },
  current: {
    temp_c: 7.2,
    condition: 'Partly cloudy',
    is_day: true,
    wind_kph: 13.0,
  },
  hourly: {
    time: ['09:00', '10:00', '11:00', '12:00'],
    temperature_2m: [6.1, 6.9, 7.4, 8.0],
  },
};

const repos = [
  {
    name: 'Hello-World',
    full_name: 'octocat/Hello-World',
    private: false,
    description: 'My first repository on GitHub!',
    fork: false,
    stargazers_count: 2231,
    language: 'C',
    homepage: 'https://github.com',
    topics: ['octocat', 'atom', 'electron', 'api'],
  },
  {
    name: 'octocat.github.io',
    full_name: 'octocat/octocat.github.io',
    private: false,
    description: null,
    fork: false,
    stargazers_count: 442,
    language: null,
    topics: [],
  },
];

const nullableMix = {
  id: 42,
  title: 'Some post',
  subtitle: null,
  published: true,
  views: 1280,
  author: {
    id: 7,
    name: 'Filip',
    avatar: null,
  },
  tags: ['typescript', 'compiler'],
  metadata: {
    edited: false,
  },
};

export const examples: Example[] = [
  {
    id: 'github-user',
    label: 'GitHub user',
    json: JSON.stringify(githubUser, null, 2),
  },
  {
    id: 'weather',
    label: 'Weather (nested objects)',
    json: JSON.stringify(weather, null, 2),
  },
  {
    id: 'repos-array',
    label: 'Repo list (array, varying keys)',
    json: JSON.stringify(repos, null, 2),
  },
  {
    id: 'nullable-mix',
    label: 'Nulls and optionals',
    json: JSON.stringify(nullableMix, null, 2),
  },
];
