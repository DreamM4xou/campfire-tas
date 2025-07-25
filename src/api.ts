const HOST = "http://localhost:5173"

export interface MeetUpCF {
  eventTime: string
  name: string
  id: string
}

export interface Member {
    id: string
    name: string
}

export default async function addMeetup(urlCampfire: string): Promise<{ meetup: MeetUpCF; members: Member[] } | null> {
  if (!urlCampfire) return null;

  const eventBizarreId = await getEventIdFromShortlink(urlCampfire);
  if (!eventBizarreId) return null;

  const events = await getMeetupsBizarreCampfireApi([eventBizarreId]);
  if (!events || events.length === 0) return null;

  const eventId = events[0].id;
  const meetup = await getMeetupCampfireApi(eventId);
  const members = getIdAndUsernameCheckinsMeetup(meetup);

  return { meetup, members };
}

async function getEventIdFromShortlink(url: string): Promise<string | null> {
  url = url.replace("https://cmpf.re", HOST + "/api-cmpf")
  try {
    const response = await fetch(url, {mode: 'cors', credentials: 'include', headers: {
    "Access-Control-Allow-Origin": "*"
    }});
    if (response.ok) {
      const html = await response.text();
      const match = html.match(/https:\/\/niantic-social\.nianticlabs\.com\/public\/meetup\/(.{8}-.{4}-.{4}-.{4}-.{12})/);
      return match ? match[1] : null;
    } else {
      console.error("Erreur HTTP :", response.status);
      return null;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

async function getMeetupsBizarreCampfireApi(meetupIdsBizarre: string[]): Promise<any[] | null> {
  const url = HOST + "/api-graphql";
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  }
  const payload = {
    query: "query PublicMeetupPage_Query(\n  $ids: [ID!]!\n) {\n  ...PublicMeetupPageMainContent_query_3pY7A9\n}\n\nfragment PublicEventDetails_event on PublicEvent {\n  id\n  name\n  details\n  clubName\n  clubId\n  clubAvatarUrl\n  isPasscodeRewardEligible\n  place {\n    location\n    name\n    formattedAddress\n  }\n  mapObjectLocation {\n    latitude\n    longitude\n  }\n  eventTime\n  eventEndTime\n  address\n}\n\nfragment PublicMeetupPageMainContent_query_3pY7A9 on Query {\n  publicMapObjectsById(ids: $ids) {\n    id\n    event {\n      ...PublicEventDetails_event\n      eventEndTime\n      id\n    }\n  }\n}\n",
    variables: {
      ids: meetupIdsBizarre,
    }
  };
  const options: RequestInit = {
    method: "post",
    // muteHttpExceptions: true,
    // followRedirects: true,
    headers,
    body: JSON.stringify(payload)
  };

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const json = await response.json();
      return json.data.publicMapObjectsById.map((data: any) => data.event);
    } else {
      console.error("Erreur HTTP :", response.status);
      return null;
    }
  } catch (error) {
    console.error("API error:", error);
    return null;
  }
}

async function getMeetupCampfireApi(meetupId: string): Promise<any | null> {
  const url = HOST + "/api-graphql";
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Content-Type": "application/json"
  }
  const payload = {
    query: "query MeetupDetailsWrapperQR_Query(\n  $id: ID!\n  $isLoggedIn: Boolean!\n  $pageSize: Int!\n) {\n  event(id: $id) {\n    id\n    ...MeetupDetailsWrapper_event_4dcqWc\n  }\n  me @include(if: $isLoggedIn) {\n    ...MeetupDetailsWrapper_me\n    id\n  }\n}\n\nfragment DiscoveryMeetupDetailsHeader_event on Event {\n  id\n  name\n  coverPhotoUrl\n  mapPreviewUrl\n  location\n  club {\n    id\n  }\n  ...DiscoveryMeetupOverflowMenu_event\n}\n\nfragment DiscoveryMeetupDetailsInfoCard_event on Event {\n  id\n  badgeGrants\n  creator {\n    displayName\n    ...DiscoveryUserAvatar_user\n    id\n  }\n  club {\n    id\n    name\n    avatarUrl\n  }\n  campfireLiveEventId\n  campfireLiveEvent {\n    eventName\n    modalHeadingImageUrl\n    id\n  }\n  members(first: $pageSize) {\n    totalCount\n  }\n}\n\nfragment DiscoveryMeetupOverflowMenu_event on Event {\n  id\n  name\n  coverPhotoUrl\n  club {\n    id\n  }\n}\n\nfragment DiscoveryUserAvatar_user on User {\n  id\n  displayName\n  username\n  avatarUrl\n  badges {\n    badgeType\n    alias\n  }\n}\n\nfragment EventAttendeeCheckInQRCodeView_event on Event {\n  id\n}\n\nfragment EventAttendeeList_event on Event {\n  id\n  eventTime\n  creator {\n    id\n    badges {\n      badgeType\n      alias\n    }\n  }\n  club {\n    id\n    game\n  }\n  members(first: $pageSize) {\n    totalCount\n  }\n  checkedInMembersCount\n}\n\nfragment EventHostCheckInQRCodeView_event on Event {\n  id\n}\n\nfragment EventLocationSharePane_locationSharingSession on LocationSharingSession {\n  id\n  expiresAt\n  isStopped\n  user {\n    id\n  }\n}\n\nfragment EventLocationSharePane_me on User {\n  id\n  displayName\n  avatarUrl\n  location\n}\n\nfragment EventRendererEditEventForm_me on User {\n  id\n  badges {\n    badgeType\n    alias\n  }\n}\n\nfragment EventRendererProvider_event_4dcqWc on Event {\n  id\n  name\n  eventTime\n  eventEndTime\n  location\n  isPasscodeRewardEligible\n  badgeGrants\n  coverPhotoUrl\n  rsvpStatus\n  rsvpStatuses {\n    userId\n    rsvpStatus\n  }\n  game\n  clubId\n  club {\n    id\n    name\n    game\n    visibility\n    amIMember\n    avatarUrl\n    myPermissions\n    creator {\n      id\n    }\n  }\n  creator {\n    id\n    displayName\n  }\n  hostLocationSharingSession @include(if: $isLoggedIn) {\n    id\n    ...EventLocationSharePane_locationSharingSession\n  }\n  members(first: $pageSize) {\n    totalCount\n    edges {\n      node {\n        id\n        displayName\n        avatarUrl\n      }\n    }\n  }\n  campfireLiveEvent {\n    checkInRadiusMeters\n    id\n  }\n  ...EventAttendeeList_event\n  ...EventRendererShareEventPane_event\n  passcode\n}\n\nfragment EventRendererProvider_me on User {\n  id\n  ...EventRendererEditEventForm_me\n  ...EventLocationSharePane_me\n}\n\nfragment EventRendererShareEventPane_event on Event {\n  id\n  name\n  visibility\n  club {\n    id\n  }\n}\n\nfragment MeetupCommentPane_event on Event {\n  id\n  creator {\n    id\n  }\n  club {\n    id\n  }\n  rsvpStatus\n  commentCount\n  isSubscribed\n  commentsPermissions\n}\n\nfragment MeetupCommentPane_me on User {\n  id\n  displayName\n  avatarUrl\n}\n\nfragment MeetupCommentsPreview_event on Event {\n  id\n  commentCount\n  commentsPermissions\n  commentsPreview {\n    id\n    body\n    createdAt\n    updatedAt\n    author {\n      id\n      displayName\n      avatarUrl\n      badges {\n        badgeType\n        alias\n      }\n    }\n  }\n}\n\nfragment MeetupCommentsPreview_me on User {\n  id\n}\n\nfragment MeetupDetailsRewardsSection_event on Event {\n  id\n  rsvpStatus\n  isPasscodeRewardEligible\n  passcode\n  club {\n    id\n  }\n}\n\nfragment MeetupDetailsRewardsSection_me on User {\n  id\n  username\n}\n\nfragment MeetupDetailsWrapper_event_4dcqWc on Event {\n  ...MeetupDetails_event\n  ...EventRendererProvider_event_4dcqWc\n}\n\nfragment MeetupDetailsWrapper_me on User {\n  ...MeetupDetails_me\n  ...EventRendererProvider_me\n}\n\nfragment MeetupDetails_event on Event {\n  id\n  name\n  address\n  coverPhotoUrl\n  details\n  eventTime\n  eventEndTime\n  rsvpStatus\n  createdByCommunityAmbassador\n  badgeGrants\n  topicId\n  commentCount\n  discordInterested\n  creator {\n    id\n    displayName\n    avatarUrl\n    badges {\n      badgeType\n      alias\n    }\n  }\n  club {\n    id\n    name\n    avatarUrl\n    visibility\n    myPermissions\n    badgeGrants\n    createdByCommunityAmbassador\n  }\n  members(first: $pageSize) {\n    totalCount\n    edges {\n      node {\n        id\n        displayName\n        avatarUrl\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n  isPasscodeRewardEligible\n  ...MeetupCommentsPreview_event\n  ...EventAttendeeCheckInQRCodeView_event\n  ...EventHostCheckInQRCodeView_event\n  ...MeetupCommentPane_event\n  ...DiscoveryMeetupDetailsInfoCard_event\n  ...DiscoveryMeetupDetailsHeader_event\n  ...MeetupDetailsRewardsSection_event\n}\n\nfragment MeetupDetails_me on User {\n  ...MeetupDetailsRewardsSection_me\n  ...MeetupCommentPane_me\n  ...MeetupCommentsPreview_me\n}",
    variables: {
      id: meetupId,
      isLoggedIn: false,
      pageSize: 10000000
    }
  };
  const options: RequestInit = {
    method: "post",
    // muteHttpExceptions: true,
    // followRedirects: true,
    headers,
    body: JSON.stringify(payload)
  };

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const json = await response.json();
      return json.data.event;
    } else {
      console.error("Erreur HTTP :", response.status);
      return null;
    }
  } catch (error) {
    console.error("API error:", error);
    return null;
  }
}

function getIdAndUsernameCheckinsMeetup(meetup: any): { id: string; name: string }[] {
  const members = meetup.members.edges.map((member: any) => ({
    id: member.node.id,
    name: member.node.displayName
  }));

  const checkinIds = meetup.rsvpStatuses
    .filter((s: any) => s.rsvpStatus === "CHECKED_IN")
    .map((s: any) => s.userId);

  return members.filter((member: any) => checkinIds.includes(member.id));
}