# language: fr
Fonctionnalité: Parcours complet de prise de rendez-vous

  En tant que patient, je veux créer mon compte, réserver un créneau chez un
  médecin, être empêché de réserver un créneau déjà occupé, annuler mon
  rendez-vous, et retrouver l'ensemble dans mon historique.

  Contexte:
    Soit un compte administrateur existant en base

  Scénario: Un patient s'inscrit, réserve, subit un conflit, annule et consulte son historique

    # 1. Création du patient, via l'inscription publique
    Quand un visiteur s'inscrit avec une adresse email inédite
    Alors la réponse a le code 201
    Et le patient obtient un jeton d'authentification

    # 2. Création du médecin, par l'administrateur
    Quand l'administrateur crée un médecin
    Alors la réponse a le code 201

    # 3. Prise de rendez-vous
    Quand le patient réserve un créneau de 30 minutes chez ce médecin
    Alors la réponse a le code 201
    Et le rendez-vous créé a le statut "scheduled"

    # 4. Conflit de créneau
    Quand le patient tente de réserver à nouveau le même créneau
    Alors la réponse a le code 409
    Et le message d'erreur signale que le créneau est déjà occupé

    # 5. Annulation
    Quand le patient annule son rendez-vous
    Alors la réponse a le code 200

    # 6. Historique
    Quand le patient consulte son historique de rendez-vous
    Alors la réponse a le code 200
    Et l'historique contient le rendez-vous avec le statut "cancelled"