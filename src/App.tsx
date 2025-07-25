import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Users, Trophy } from "lucide-react"
import addMeetup, { type Member } from "./api"
import i18n from './i18n';
import { useTranslation } from 'react-i18next';

/**
 * TODO :
 * - Loader récuparation de la donnée
 * - Input disabled récuparation de la donnée
 * - Tirage au sort 1 par 1, 2s entre chaque
 * - Input disabled Tirage au sort
 */


interface Rencontre {
  lien: string
  id: string
  titre: string
  participants: Member[]
}

interface Participant {
  nom: string
  id: string
  rencontres: number
  actif: boolean
}


export default function CampfireLottery() {
  const { t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const MAX_TIRAGE = 50;
  // Formulaire react-hook-form pour l'ajout de rencontre
  const lienSchema = z.object({
    lienRencontre: z.url({ message: t("invalid_link") }).regex(/^https:\/\/cmpf\.re\//, { message: t("link_must_start_with") })
  });
  type LienForm = z.infer<typeof lienSchema>;

  // Formulaire react-hook-form pour les options de tirage
  const tirageSchema = z.object({
    nombreTirages: z
      .number()
      .min(0, { message: t("at_least_one_draw") })
      .max(MAX_TIRAGE, { message: t("max_draws").replace("${MAX_TIRAGE}", MAX_TIRAGE.toString()) }),
    modeParticipation: z.enum(["unique", "rencontre"]),
  });
  type TirageForm = z.infer<typeof tirageSchema>;

  const formLink = useForm<LienForm>({
    resolver: zodResolver(lienSchema),
    defaultValues: { lienRencontre: "" }
  });
  const [rencontres, setRencontres] = useState<Rencontre[]>([]);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const tirageForm = useForm<TirageForm>({
    resolver: zodResolver(tirageSchema),
    defaultValues: {
      nombreTirages: 1,
      modeParticipation: "unique",
    },
  });
  const [resultats, setResultats] = useState<string[]>([]);
  const [statistiques, setStatistiques] = useState({ joueurs: { actif: 0, total: 0 }, participations: { actif: 0, total: 0 } });
  const [maxTirage, setMaxTirage] = useState(0);
  const [tirageEnCours, setTirageEnCours] = useState(false);

  const ajouterRencontre = async (data: LienForm) => {
    const infos = await addMeetup(data.lienRencontre);
    if (infos) {
      const titre = infos.meetup.name + ' - ' + new Intl.DateTimeFormat("fr-FR").format(new Date(infos.meetup.eventTime));
      const nouvelleRencontre: Rencontre = {
        lien: data.lienRencontre,
        id: infos.meetup.id,
        titre,
        participants: infos.members,
      };
      // Vérifie si l'id existe déjà
      if (rencontres.some(r => r.id === nouvelleRencontre.id)) {
        formLink.setError("lienRencontre", { type: "manual", message: t("duplicate_meeting") });
        return;
      }
      if (tirageForm.getValues('nombreTirages') < 1) {
        tirageForm.setValue('nombreTirages', 1);
      }
      setRencontres((prev) => [...prev, nouvelleRencontre]);
      formLink.reset();
    } else {
      formLink.setError("lienRencontre", { type: "manual", message: t("adding_error") });
    }
  }

  const supprimerRencontre = (id: string) => {
    setRencontres((prev) => prev.filter((r) => r.id !== id))
  }

  const toggleParticipant = (id: string) => {
    if (tirageEnCours) return; // Ne pas modifier pendant un tirage
    const participant = participants.get(id);
    if (!participant) return;

    participant.actif = !participant.actif;
    const newParticipants = new Map(participants)
    newParticipants.set(id, participant);
    setParticipants(newParticipants);
  }

  const lancerTirage = async (data: TirageForm) => {
    const { nombreTirages, modeParticipation } = data;
    // Construire la liste des participants éligibles
    let participantsEligibles: string[] = [];
    if (modeParticipation === "unique") {
      participantsEligibles = Array.from(participants.values())
        .filter((p) => p.actif)
        .map((p) => p.nom);
    } else {
      // Pour chaque participant actif, on ajoute son nom autant de fois qu'il a participé à une rencontre
      Array.from(participants.values())
        .filter((p) => p.actif)
        .forEach((p) => {
          for (let i = 0; i < p.rencontres; i++) {
            participantsEligibles.push(p.nom);
          }
        });
    }

    if (participantsEligibles.length === 0) {
      setResultats([t("no_eligible_participants")]);
      return;
    }

    setTirageEnCours(true);
    setResultats([]);

    // Tirage sans doublon de gagnant
    const gagnants: string[] = [];
    const dejaGagnants = new Set<string>();
    let pool = [...participantsEligibles];

    setResultats([...gagnants, ...Array(nombreTirages - gagnants.length).fill(null)]);
    // Attendre 1s avant d'afficher le suivant
    await new Promise((res) => setTimeout(res, 1000));
    for (let i = 0; i < nombreTirages; i++) {
      // Exclure les gagnants précédents
      const poolSansGagnants = pool.filter((nom) => !dejaGagnants.has(nom));
      if (poolSansGagnants.length === 0) {
        gagnants.push(t("no_more_participants"));
        setResultats([...gagnants]);
        break;
      }
      const index = Math.floor(Math.random() * poolSansGagnants.length);
      const gagnant = poolSansGagnants[index];
      gagnants.push(gagnant);
      dejaGagnants.add(gagnant);
      setResultats([...gagnants, ...Array(nombreTirages - gagnants.length).fill(null)]);
      // Attendre 1s avant d'afficher le suivant, sauf pour le dernier
      if (i < nombreTirages - 1) {
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
    setTirageEnCours(false);
  }

  // Mise à jour des participants quand les rencontres changent
  useEffect(() => {
    // Si moins de 2 rencontres, forcer le mode unique dans le form
    if (rencontres.length < 2) {
      tirageForm.setValue('modeParticipation', 'unique');
    }
    const participantsMap = new Map<string, Participant>()

    rencontres.forEach((rencontre) => {
      rencontre.participants.forEach((participant) => {
        if (participantsMap.has(participant.id)) {
          const p = participantsMap.get(participant.id);
          p!.rencontres++
          participantsMap.set(participant.id, p!);
        } else {
          participantsMap.set(participant.id, {
            id: participant.id,
            nom: participant.name,
            actif: true,
            rencontres: 1
          })
        }
      })
    })

    setParticipants(participantsMap)
  }, [rencontres])

  // Mise à jour des statistiques

  useEffect(() => {
    const joueurs = {
      total: participants.size,
      actif: 0
    };
    const participations = { total: 0, actif: 0 };
    const mode = tirageForm.getValues('modeParticipation');
    for (const [, value] of participants) {
      if (value.actif) {
        joueurs.actif++;
      }
      if (mode === 'rencontre') {
        participations.total += value.rencontres;
        if (value.actif) {
          participations.actif += value.rencontres;
        }
      }
    }

    const max = joueurs.actif > MAX_TIRAGE ? MAX_TIRAGE : joueurs.actif
    setMaxTirage(max);
    // Synchronise le slider et le form si max change
    if (tirageForm.getValues('nombreTirages') > max) {
      tirageForm.setValue('nombreTirages', max);
    }
    setStatistiques({ joueurs, participations })
  }, [participants, tirageForm])


return (
  <div className="container mx-auto p-6 max-w-4xl space-y-6">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <div className="mt-4 flex gap-2 justify-end">
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('fr')}>Français</button>
      </div>
    </div>

    {/* Section 1: Ajout de Rencontre */}
    <Card>
      <CardHeader>
        <CardTitle>{t('meetings')} ({rencontres.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...formLink}>
          <form className="flex gap-2" onSubmit={formLink.handleSubmit(ajouterRencontre)}>
            <FormField
              control={formLink.control}
              name="lienRencontre"
              render={({ field }) => (
                <FormItem className="grid w-full gap-2">
                  <Label htmlFor="lien-rencontre">{t('meeting_link_label')}</Label>
                  <FormControl>
                    <Input
                      id="lien-rencontre"
                      type="text"
                      placeholder="https://cmpf.re/xxx"
                      autoComplete="off"
                      disabled={formLink.formState.isSubmitting || tirageEnCours}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-6 flex items-center justify-center gap-2"
              disabled={formLink.formState.isSubmitting || tirageEnCours}>
              {formLink.formState.isSubmitting && (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {formLink.formState.isSubmitting ? t("add_in_progress") : t("add")}
            </Button>
          </form>
        </Form>
        <div className="pt-6">
          {rencontres.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t("no_meetings_added")}</p>
          ) : (
            <ul className="space-y-2">
              {rencontres.map((rencontre) => (
                <li key={rencontre.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{rencontre.titre}</h4>
                    <p className="text-sm text-muted-foreground">
                      {rencontre.participants.length} {t("participants")}
                      <code className="italic"> - {rencontre.lien}</code>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => supprimerRencontre(rencontre.id)}
                    disabled={tirageEnCours}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Section 2 & 3: Formulaire d'options de tirage et résultats */}
    <Form {...tirageForm}>
      <form
        onSubmit={tirageForm.handleSubmit(lancerTirage)}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Colonne 1: Options + Résultats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('draw_options')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nombre de tirages */}
              <FormField
                control={tirageForm.control}
                name="nombreTirages"
                render={({ field }) => (
                  <FormItem>
                    <Label>{t('number_of_draws')}</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <FormControl>
                        <Slider
                          disabled={maxTirage === 0 || tirageEnCours}
                          value={[field.value]}
                          onValueChange={(val) => {
                            field.onChange(val[0]);
                          }}
                          max={maxTirage || 1}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                      </FormControl>
                      <FormControl>
                        <Input
                          disabled={maxTirage === 0 || tirageEnCours}
                          type="number"
                          min={1}
                          max={maxTirage || 1}
                          value={field.value}
                          onChange={(e) => {
                            const value = Number.parseInt(e.target.value) || 1;
                            const clampedValue = Math.max(1, Math.min(maxTirage, value));
                            field.onChange(clampedValue);
                          }}
                          className="w-20"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mode de participation */}
              <FormField
                control={tirageForm.control}
                name="modeParticipation"
                render={({ field }) => (
                  <FormItem>
                    <Label>{t('participation_mode')}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value === "unique" ? "default" : "outline"}
                          onClick={() => field.onChange("unique")}
                          className="flex-1"
                          disabled={tirageEnCours}
                        >
                          {t('unique_participation')}
                        </Button>
                      </FormControl>
                      <FormControl>
                        <Button
                          type="button"
                          disabled={rencontres.length < 2 || tirageEnCours}
                          variant={field.value === "rencontre" ? "default" : "outline"}
                          onClick={() => field.onChange("rencontre")}
                          className="flex-1"
                        >
                          {t('participation_per_meeting')}
                        </Button>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Résultats du tirage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t('draw_results')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{t('active_players')} :</span>
                  <Badge variant="default">{statistiques.joueurs.actif} / {statistiques.joueurs.total}</Badge>
                </div>
                {tirageForm.watch('modeParticipation') !== 'unique' && (
                  <div className="flex justify-between text-sm">
                    <span>{t('active_participations')} :</span>
                    <Badge variant="default">{statistiques.participations.actif} / {statistiques.participations.total}</Badge>
                  </div>
                )}

                <Separator />

                <Button
                  type="submit"
                  className="w-full bg-transparent bg-gradient-to-r from-amber-500 via-amber-500/60 to-amber-500 [background-size:200%_auto] text-black hover:bg-transparent hover:bg-[99%_center] focus-visible:ring-amber-500/20 dark:from-amber-400 dark:via-amber-400/60 dark:to-amber-400 dark:focus-visible:ring-amber-400/40"
                  size="lg"
                  disabled={statistiques.joueurs.actif === 0 || tirageEnCours}
                >
                  {tirageEnCours ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-2" />
                      {t('launch_draw')}
                    </>
                  )}
                </Button>

                <Separator />

                {resultats.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t('winners')}:</h4>
                    <ul className="space-y-1">
                      {resultats.map((resultat, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Badge variant="default">#{index + 1}</Badge>
                          {resultat === null ? (
                            <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <span className="font-medium">{resultat}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne 2: Liste des participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('participants_list')}
            </CardTitle>
            <CardDescription>{t('click_to_toggle_participant')}</CardDescription>
          </CardHeader>
          <CardContent>
            {participants.size === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('no_participants_yet')}</p>
            ) : (
              <ul className="space-y-2">
                {Array.from(participants.values()).map((participant) => (
                  <li key={participant.nom}>
                    <button
                      type="button"
                      onClick={() => toggleParticipant(participant.id)}
                      disabled={tirageEnCours}
                      className={`w-full text-left p-2 rounded border transition-colors ${participant.actif
                          ? "hover:bg-muted border-border"
                          : "bg-muted/50 border-muted text-gray-400 line-through"
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{participant.nom}</span>
                        <Badge variant="outline" className={`text-xs${ participant.actif ? "" : " text-gray-400"}`}>
                          {participant.rencontres} {t("meetups_badge")}
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  </div>
);
}
