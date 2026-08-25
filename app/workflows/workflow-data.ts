export type WorkflowSeo = {
  title: string
  description: string
  keywords: string[]
  faqs: { question: string; answer: string }[]
}

export type Workflow = {
  slug: string
  title: string
  category: string
  intent: string
  description: string
  bestFor: string[]
  cta: string
  seo?: WorkflowSeo
}

const faq = (question: string, answer: string) => ({ question, answer })
const seo = (title: string, description: string, keywords: string[], faqs: WorkflowSeo['faqs']): WorkflowSeo => ({ title, description, keywords, faqs })

export const workflows: Workflow[] = [
  {
    slug: 'public-records-request',
    title: 'Public Records Request',
    category: 'Start here',
    intent: 'public records request',
    description: 'Turn a plain-English objective into a precise request with record categories, date ranges, custodians, identifiers, format requirements, and exclusions.',
    bestFor: ['General public records', 'Agency records', 'Open records requests'],
    cta: 'Build a records request',
    seo: seo(
      'Public Records Request — How to Request Government Records',
      'Build a precise public records request with the agency, records sought, dates, custodians, identifiers, formats, and scope needed for a searchable request.',
      ['public records request', 'public records request template', 'how to make a public records request', 'request public records', 'government records request', 'open records request', 'public information request', 'records request letter', 'public records request form', 'how to request government records'],
      [
        faq('What is a public records request?', 'A public records request asks a government agency for identifiable records it maintains. A strong request clearly describes the records, relevant time period, and useful identifiers or custodians.'),
        faq('What should I include in a public records request?', 'Include the agency, subject or matter, specific record categories, date range, known names or identifiers, preferred format when appropriate, and useful narrowing information.'),
        faq('How do identifiers make a records request easier to search?', 'An address, parcel number, case number, permit number, incident number, person, project name, or other agency identifier can substantially reduce ambiguity and help the custodian locate the right records.'),
        faq('What if the agency produces only part of the request?', 'Keep the original scope and compare the production against it. Missing categories, referenced-but-unproduced records, duplicates, redactions, and other gaps can become targeted follow-up items.'),
      ],
    ),
  },
  {
    slug: 'police-records',
    title: 'Police Records Request',
    category: 'Law enforcement',
    intent: 'police records request',
    description: 'Request incident reports, arrest records, dispatch materials, body-camera records, 911 calls, photographs, and related police records with enough specificity to make the request searchable.',
    bestFor: ['Incident reports', 'Police reports', 'Arrest and booking records', 'CAD / dispatch records', 'Body- and dash-camera records'],
    cta: 'Build a Police Records Request',
    seo: seo(
      'Police Records Request — Incident Reports, CAD & Body-Camera Records',
      'Build a targeted police records request for an incident, arrest, dispatch call, body-camera recording, 911 call, photograph, or related case record.',
      ['police records request', 'police report request', 'request police records', 'police public records request', 'police incident report request', 'CAD records request', 'dispatch records request', 'body camera records request', 'bodycam records request', 'dashcam records request', '911 call records request', 'arrest records request', 'police records by incident number', 'police records by date', 'police records by address'],
      [
        faq('How do I request a police report?', 'Start with the police agency, incident date, location or incident number, and a plain-English description of the event. People or vehicle identifiers can make the request more precise.'),
        faq('Can I request body-camera footage?', 'Potentially. The workflow can identify body-camera records and their associated incident, dates, and identifiers. Whether footage is releasable depends on the agency and applicable law.'),
        faq('Can I request 911 calls and dispatch records?', 'Yes, where maintained and legally requestable. They are separate request categories so the agency can search the relevant systems.'),
        faq('What if I do not know the incident number?', 'Use the incident date, location, people involved, vehicle identifiers, or a clear description of the event.'),
      ],
    ),
  },
  {
    slug: 'court-records',
    title: 'Court Records Request',
    category: 'Courts',
    intent: 'how to get court records',
    description: 'Organize a request for case files, docket materials, filings, exhibits, and other court-held records while preserving case identifiers and date ranges.',
    bestFor: ['Case files', 'Dockets', 'Court filings', 'Exhibits'],
    cta: 'Request court records',
    seo: seo(
      'Court Records Request — Case Files, Dockets, Filings & Exhibits',
      'Build a focused court records request around the court, case number, parties, filing dates, docket entries, filings, exhibits, and other case materials.',
      ['court records request', 'court records request form', 'how to request court records', 'request court case file', 'court case file request', 'docket records request', 'court filing records request', 'court exhibits request', 'case docket request', 'court documents request', 'court records by case number'],
      [
        faq('How do I request a court case file?', 'Identify the court, case number if known, parties, relevant dates, and the specific materials sought. Procedures can differ by court and record type.'),
        faq('Can I request court exhibits?', 'You can specifically identify exhibits, attachments, and filed supporting materials. Availability and copy rules depend on the court and record.'),
        faq('Are all court records public?', 'No. Some records can be restricted, sealed, confidential, or otherwise subject to access limits.'),
        faq('What if I only know the parties and approximate date?', 'Provide the court, parties, approximate filing or hearing period, case type, and any other identifiers you have so the search can be narrowed.'),
      ],
    ),
  },
  {
    slug: 'property-records',
    title: 'Property & Parcel Records',
    category: 'Property',
    intent: 'request property records',
    description: 'Build a targeted request for property, parcel, assessor, recorder, ownership, and related public records tied to a property or parcel.',
    bestFor: ['Property files', 'Parcel records', 'Ownership records', 'Recorder records'],
    cta: 'Request property records',
    seo: seo(
      'Property Records Request — Parcel, Ownership & Property Files',
      'Build a property records request using an address, APN or parcel number, owner, legal description, document number, and date range.',
      ['property records request', 'property records by address', 'property records request by APN', 'parcel records request', 'property ownership records request', 'assessor records request', 'recorder records request', 'property file request', 'property history records', 'real property records request', 'request property records from county'],
      [
        faq('How do I request property records?', 'Start with the property address and add the parcel/APN, owner, document number, legal description, or date range if known.'),
        faq('Can I request property records by APN?', 'Yes. Parcel or APN information is often a strong identifier for county or municipal property systems.'),
        faq('What property records can I ask for?', 'Depending on the custodian, you may target assessor records, recorder documents, property files, ownership records, permits, planning records, and other identifiable records.'),
        faq('What if I do not know the parcel number?', 'The address and other known property identifiers can still provide a useful starting point. An APN can be added later if discovered.'),
      ],
    ),
  },
  {
    slug: 'code-enforcement-records',
    title: 'Code Enforcement Records Request',
    category: 'Property & Code Enforcement',
    intent: 'code enforcement records request',
    description: 'Create a focused public-records request for code violations, complaints, inspections, notices, photographs, permits, citations, communications, and enforcement history for a property or case.',
    bestFor: ['Code violation histories', 'Inspection records', 'Complaints and photographs', 'Notices, citations and enforcement files', 'Property-specific code records'],
    cta: 'Build a Code Enforcement Records Request',
    seo: seo(
      'Code Enforcement Records Request — Property Violations, Inspections & Case Files',
      'Create a focused code enforcement records request for property violations, complaints, inspections, notices, permits, citations, photos, communications, and enforcement history. Build and mail your request.',
      ['code enforcement records request', 'code enforcement public records request', 'request code enforcement records', 'code violation records request', 'property code enforcement records', 'code enforcement complaint records', 'code enforcement inspection records', 'code violation history request', 'property violation records', 'building code enforcement records', 'code enforcement case records', 'code enforcement records by address', 'code enforcement records by parcel number', 'code enforcement records by case number', 'code enforcement request template'],
      [
        faq('Can I request code enforcement records for a property?', 'Yes. Identify the property by address, parcel or APN, case number, violation number, or other identifiers and specify the categories of records sought.'),
        faq('What code enforcement records can I request?', 'Depending on the agency, you may request complaints, inspections, photographs or video, notices, citations, orders, permits, correspondence, abatement records, and other identifiable enforcement records.'),
        faq('Can I request code enforcement records by address?', 'Yes. An address is often a useful identifier. Adding an APN, case number, violation number, or date range can make the request more precise.'),
        faq('What if the agency only produces some of the records?', 'The workflow preserves the original request scope so the production can be reviewed for missing categories, references to unproduced records, gaps, and follow-up needs.'),
      ],
    ),
  },
  {
    slug: 'permit-inspection-records',
    title: 'Permit & Inspection Records',
    category: 'Property',
    intent: 'permit records request',
    description: 'Target permits, plans, inspection reports, correction notices, approvals, and related building-department records with project identifiers and date ranges.',
    bestFor: ['Building permits', 'Inspection reports', 'Plans', 'Correction notices'],
    cta: 'Request permit records',
    seo: seo(
      'Building Permit Records Request — Permits, Inspections, Plans & History',
      'Build a targeted property permit records request using an address, parcel/APN, permit number, owner, project, permit type, and date range.',
      ['property permit records request', 'building permit records request', 'permit records by address', 'permit records by APN', 'building permit history request', 'inspection records request', 'building inspection records', 'approved plans request', 'permit application records request', 'certificate of occupancy records', 'permit history request', 'historical building permit records'],
      [
        faq('What property permit records can I request?', 'The workflow can target permits, applications, inspections, approved plans, site plans, plan-review comments, correction notices, certificates of occupancy, permit history, and related correspondence.'),
        faq('What information helps locate permit records?', 'A property address, parcel/APN, permit number, owner or applicant, project description, and date range can make the search more precise.'),
        faq('Can I request approved building plans?', 'The request can specifically identify approved plans, drawings, specifications, plan sets, and revisions. Releasability depends on the agency and applicable law.'),
        faq('What if I only know the address and approximate project year?', 'Use the address, approximate date range, project description, owner or applicant name if known, and any permit details you already have.'),
      ],
    ),
  },
  {
    slug: 'government-communications-records',
    title: 'Government Emails & Communications Records',
    category: 'Communications',
    intent: 'government email records request',
    description: 'Build a precise request for government emails, attachments, texts, messaging, calendars, letters, meeting follow-up, and communications with outside parties using custodians, search terms, and date ranges.',
    bestFor: ['Government emails', 'Email attachments', 'Text and messaging records', 'Communications with contractors and developers', 'Calendar and meeting communications'],
    cta: 'Build a Government Communications Request',
    seo: seo(
      'Government Email & Communications Records Request',
      'Build a targeted government communications records request for emails, attachments, texts, messaging, calendars, and communications using custodians, keywords, projects, outside parties, and date ranges.',
      ['government email records request', 'government emails public records request', 'public records email request', 'request government emails', 'government communications records request', 'agency email records', 'government text messages public records', 'government text message records request', 'public records request emails and attachments', 'government communications request template', 'government emails by custodian', 'government emails by date range', 'government emails by keyword', 'public records email search terms', 'agency communications records'],
      [
        faq('How should I request government emails?', 'Identify the agency, date range, subject or project, likely custodians, and distinctive search terms. A focused request is easier to search and review.'),
        faq('Can I request government text messages?', 'Potentially. The workflow can separately identify text messages and agency messaging records where those communications are maintained and legally requestable.'),
        faq('Should email attachments be requested separately?', 'Yes. Identifying attachments explicitly helps preserve them as a production category and makes missing attachments easier to spot.'),
        faq('What if the agency says it found no responsive emails?', 'Preserve the exact request scope and search constraints. A follow-up can ask about custodians, systems, dates, or search terms without assuming whether records exist.'),
      ],
    ),
  },
  {
    slug: 'planning-records',
    title: 'Planning & Development Records',
    category: 'Planning',
    intent: 'planning records request',
    description: 'Request planning applications, staff reports, zoning materials, development correspondence, meeting records, and related agency files.',
    bestFor: ['Planning files', 'Zoning records', 'Development applications', 'Staff reports'],
    cta: 'Request planning records',
    seo: seo(
      'Planning Records Request — Zoning, Development Applications & Staff Reports',
      'Build a focused planning and development records request for zoning files, applications, staff reports, correspondence, meeting materials, permits, and project records.',
      ['planning records request', 'planning department records request', 'zoning records request', 'zoning file request', 'development application records request', 'planning application records', 'staff report request', 'land use records request', 'planning commission records request', 'development project records request', 'zoning public records request', 'planning records by address'],
      [
        faq('What planning records can I request?', 'You can identify planning applications, zoning materials, staff reports, project correspondence, meeting materials, resolutions, notices, and other records tied to a project or property.'),
        faq('Can I request planning records for a development project?', 'Yes. Use the project name, address, parcel/APN, applicant, project number, or date range to narrow the request.'),
        faq('Can I request zoning records by address?', 'Yes. An address plus parcel or project identifiers can help connect planning and zoning records to a specific property.'),
        faq('What if the project has changed names?', 'Include known names, applicant names, project numbers, addresses, and date ranges so the custodian can search across naming changes.'),
      ],
    ),
  },
  {
    slug: 'case-records',
    title: 'Records About a Specific Case',
    category: 'Case research',
    intent: 'records about a specific case',
    description: 'Build a case-centered request that connects names, addresses, case numbers, dates, departments, and referenced documents into one coherent records scope.',
    bestFor: ['Enforcement cases', 'Administrative cases', 'Agency investigations', 'Cross-department records'],
    cta: 'Build a case request',
    seo: seo(
      'Case Records Request — Build a Complete Government Case File Search',
      'Build a case-centered public records request using case numbers, people, properties, departments, dates, related documents, and referenced records.',
      ['case records request', 'case file records request', 'government case file request', 'agency case records', 'administrative case records request', 'investigation records request', 'enforcement case records', 'case records by number', 'case records by address', 'case records by name', 'request agency investigation records', 'public records case file'],
      [
        faq('How do I request records about a specific government case?', 'Identify the case number if known, agency or department, people or property involved, date range, and categories of records you want.'),
        faq('What if I do not know the case number?', 'Use the people, property, event, project, department, and date information available. A clear factual description can still provide a useful search anchor.'),
        faq('What are cross-referenced records?', 'A case file may refer to photographs, permits, correspondence, inspections, attachments, or other records held elsewhere. Explicitly identifying those categories improves production review.'),
        faq('What if records are spread across more than one department?', 'List the departments or custodians most likely to maintain responsive records and keep the case identifiers consistent across the request scope.'),
      ],
    ),
  },
  {
    slug: 'foia-request',
    title: 'FOIA / Federal Records Request',
    category: 'Federal',
    intent: 'how do I file a FOIA request',
    description: 'Prepare a federal records request with a clear description of the records, date range, custodians or systems when known, and the requester information needed for the agency.',
    bestFor: ['Federal agencies', 'FOIA requests', 'Federal records'],
    cta: 'Build a FOIA request',
    seo: seo(
      'FOIA Request — How to File a Federal Records Request',
      'Build a focused federal FOIA request with agency, records sought, date range, custodians, identifiers, search terms, and delivery preferences.',
      ['FOIA request', 'how to file a FOIA request', 'FOIA request template', 'FOIA records request', 'federal records request', 'request federal government records', 'FOIA letter', 'FOIA request example', 'federal public records request', 'FOIA request by agency', 'FOIA documents request', 'FOIA records search'],
      [
        faq('How do I file a FOIA request?', 'Identify the federal agency likely to maintain the records, describe the records with reasonable specificity, provide relevant dates and identifiers, and use the agency’s accepted submission channel.'),
        faq('What should a FOIA request include?', 'Identify the records sought, relevant time period, custodians or systems when known, distinctive search terms, and any requester or fee information the agency requires.'),
        faq('Can I ask a federal agency to search by name or keyword?', 'Yes. Names, project terms, document titles, case numbers, and other distinctive search terms can help the agency locate responsive records.'),
        faq('Is FOIA the law for state and local records?', 'Usually not. Federal FOIA applies to federal executive-branch agencies; state and local records are generally governed by applicable state or local public-records law.'),
      ],
    ),
  },
]
