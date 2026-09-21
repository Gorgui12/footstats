export interface Dictionary {
  common: {
    siteName: string;
    search: string;
    myFavorites: string;
    seeAll: string;
    manage: string;
    loading: string;
  };
  nav: {
    home: string;
    matches: string;
    competitions: string;
    standings: string;
    news: string;
    favorites: string;
  };
  footer: {
    about: string;
    legal: string;
    privacy: string;
    contact: string;
  };
  home: {
    live: string;
    noLiveMatches: string;
    upcomingMatches: string;
    noUpcomingMatches: string;
    recentResults: string;
    noRecentResults: string;
    popularCompetitions: string;
    playersToWatch: string;
    yourFavorites: string;
  };
  matchCard: {
    halftime: string;
    live: string;
    finished: string;
    postponed: string;
    cancelled: string;
    unknownTeam: string;
  };
  states: {
    demoNotConfirmed: string;
    lastUpdated: string;
  };
  favoriteButton: {
    add: string;
    added: string;
  };
  matchesPage: {
    today: string;
    noMatchesToday: string;
    otherMatches: string;
    noOtherMatches: string;
  };
  matchPage: {
    broadcast: string;
    infoUnavailable: string;
    events: string;
    noEvents: string;
    statistics: string;
    noStatistics: string;
    notFoundTitle: string;
    notFoundDescription: string;
    statusUpcoming: string;
    statusLive: string;
    statusHalftime: string;
    statusFinished: string;
    statusPostponed: string;
    statusCancelled: string;
    statusAfterExtraTime: string;
    statusAfterPenalties: string;
    atCountryTime: string;
  };
  teamPage: {
    squad: string;
    noSquad: string;
    upcomingMatches: string;
    noUpcomingMatches: string;
    recentResults: string;
    noRecentResults: string;
    foundedIn: string;
    notFoundTitle: string;
    notFoundDescription: string;
  };
  playerPage: {
    statistics: string;
    infoUnavailable: string;
    notFoundTitle: string;
    notFoundDescription: string;
    noPositionListed: string;
  };
  competitionPage: {
    matches: string;
    noMatches: string;
    seeStandings: string;
    notFoundTitle: string;
    notFoundDescription: string;
    noCompetitions: string;
  };
  standingsPage: {
    title: string;
    noStandings: string;
    columns: {
      position: string;
      team: string;
      played: string;
      wins: string;
      draws: string;
      losses: string;
      goalsFor: string;
      goalsAgainst: string;
      goalDifference: string;
      points: string;
    };
    notFoundTitle: string;
    notFoundDescription: string;
  };
  searchPage: {
    title: string;
    placeholder: string;
    submit: string;
    prompt: string;
    noResults: string;
    teams: string;
    players: string;
    competitions: string;
    matches: string;
  };
  favoritesPage: {
    title: string;
    empty: string;
    upcomingForFavoriteTeams: string;
    noUpcomingForFavorites: string;
    followedTeams: string;
    noFollowedTeams: string;
    followedPlayers: string;
    noFollowedPlayers: string;
    followedCompetitions: string;
    noFollowedCompetitions: string;
  };
  notificationsPage: {
    title: string;
    enabledDescription: string;
    disabledDescription: string;
    save: string;
    matchStart: { label: string; description: string };
    goal: { label: string; description: string };
    matchEnd: { label: string; description: string };
    lineup: { label: string; description: string };
    breakingNews: { label: string; description: string };
    favoriteEntityUpdates: { label: string; description: string };
  };
}
