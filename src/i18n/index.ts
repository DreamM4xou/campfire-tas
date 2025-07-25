import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "title": "Campfire Meetups - Lottery Draw",
      "description": "Perform flexible and fair draws",
      "add_in_progress": "Adding...",
      "no_meetings": "No meetings added yet",
      "participants_list": "Participants List",
      "click_to_toggle_participant": "Click to toggle participant",
      "draw_options": "Draw Options",
      "number_of_draws": "Number of draws",
      "unique_participation": "Unique Participation",
      "participation_per_meeting": "Participation per meetup",
      "participation_mode": "Participation Mode",
      "draw_results": "Draw Results",
      "active_players": "Active participants",
      "active_participations": "Total participations",
      "start_draw": "Start Draw",
      "winner": "Winner(s)",
      "no_eligible_participants": "No eligible participants",
      "adding_error": "Unable to fetch meetup details",
      "duplicate_meeting": "This meetup has already been added",
      "more_participants_needed": "More participants needed",
      "no_participants_yet": "No participants yet",
      "meetings": "Meetings",
      "no_meetings_added": "No meetups added yet",
      "add": "Add",
      "meeting_link_label": "Meetup Link Campfire",
      "no_more_participants": "No more participants available",
      "invalid_link": "Invalid link",
      "link_must_start_with": "The link must start with https://cmpf.re/",
      "at_least_one_draw": "At least 1 draw",
      "max_draws": "Maximum ${MAX_TIRAGE} draws",
      "participants": "Participants",
      "launch_draw": "Launch Draw",
      "draw_in_progress": "Draw in progress...",
      "meetups_badge": "meetup(s)",
    }
  },
  fr: {
    translation: {
      "title": "Tirage au Sort - Rencontres Campfire",
      "description": "Effectuez des tirages au sort souples et équitables",
      "add_in_progress": "Ajout en cours...",
      "no_meetings": "Aucune rencontre ajoutée pour le moment",
      "participants_list": "Liste des Participants",
      "click_to_toggle_participant": "Cliquez pour activer/désactiver un participant",
      "draw_options": "Options de Tirage",
      "number_of_draws": "Nombre de tirages",
      "unique_participation": "Participation unique",
      "participation_per_meeting": "Participation par rencontre",
      "participation_mode": "Mode de participation",
      "draw_results": "Résultats du Tirage",
      "active_players": "Participants actifs",
      "active_participations": "Participations totales",
      "start_draw": "Lancer le tirage",
      "winner": "Gagnant(s)",
      "no_eligible_participants": "Aucun participant éligible",
      "adding_error": "Impossible de récupérer les informations de la rencontre",
      "duplicate_meeting": "Cette rencontre a déjà été ajoutée",
      "more_participants_needed": "Plus de participants nécessaires",
      "no_participants_yet": "Aucun participant pour le moment",
      "meetings": "Rencontres",
      "no_meetings_added": "Aucune rencontre ajoutée pour le moment",
      "add": "Ajouter",
      "meeting_link_label": "Lien de la rencontre Campfire",
      "no_more_participants": "Plus de participants disponibles",
      "invalid_link": "Lien invalide",
      "link_must_start_with": "Le lien doit commencer par https://cmpf.re/",
      "at_least_one_draw": "Au moins 1 tirage",
      "max_draws": "Maximum ${MAX_TIRAGE} tirages",
      "participants": "Participants",
      "launch_draw": "Lancer le tirage",
      "draw_in_progress": "Tirage en cours...",
      "meetups_badge": "rencontre(s)",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
