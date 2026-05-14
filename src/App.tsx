import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Lock,
  MoreVertical,
  Plus,
  X,
} from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import './App.css'

type AccountStatus = 'existing' | 'new'
type LookupState =
  | 'idle'
  | 'existing-old-account'
  | 'existing-old-account-with-child-profile-contact'
  | 'existing-not-registered'
  | 'existing-child-phone'
  | 'existing-child-profile-contact'
  | 'existing-child-profiles-same-parent'
  | 'existing-child-profiles-cross-parent'
  | 'existing-multiple-matches'
  | 'existing-parent-single-child'
  | 'existing-parent-with-children'
  | 'existing-parent-empty'
  | 'new-available'
  | 'new-registered'
type CalloutVariant = 'info' | 'warning' | 'danger' | 'success'
type PrototypeOptionId = '1' | '2' | '3'
type ContactOwner = 'child' | 'parent' | null
type ProfileTarget = 'existing' | 'new' | null
type PackageIntent = 'renewal' | 'upgrade' | 'additional' | null
type LeadAssignmentStatus = 'assigned-to-me' | 'no-lead'
type WizardStep = 1 | 2 | 3 | 4 | 5
type ChildProfile = {
  contact?: string
  grade: string
  leadStatus?: LeadAssignmentStatus
  lastLoginAt?: string
  hasActivePackage?: boolean
  id: string
  name: string
  packageName?: string
  packageNames?: string[]
  parentName?: string
  parentPhone?: string
  parentSerial?: string
  serial: string
}
type ParentProfileAccount = {
  name: string
  phone: string
  profiles: ChildProfile[]
  serial: string
}

const benefits = [
  'ADAPTO: Satu-satunya video belajar interaktif di Indonesia. Bisa sesuaikan pemahaman siswa!',
  '>65rb video belajar premium dengan ADAPTO',
  '>400rb latihan soal serta pembahasan',
  'Latihan Bab, Banksoal, dan Tryout PTS, PAS, US di ruanglatihan',
  'Akses semua mata pelajaran 10-11-12 SMA/SMK',
  'Rangkuman infografis di setiap bab',
  'Playlist Belajar (Rencana belajar dari Master Teacher)',
  'Download materi offline',
  'Ruangguru Adventure & Teman Belajar',
  'Laporan Belajar',
]

const prototypeOptions: Array<{
  id: PrototypeOptionId
  label: string
  title: string
  summary: string
  steps: string[]
}> = [
  {
    id: '1',
    label: 'Opsi 1',
    title: 'Checkout-led Migration',
    summary: 'Migrasi muncul di dalam draft invoice. Ini baseline yang paling dekat dengan flow bayar saat ini.',
    steps: ['Pilih status akun', 'Cek nomor', 'Lengkapi data migrasi', 'Review lalu pilih metode bayar'],
  },
  {
    id: '2',
    label: 'Opsi 2',
    title: 'Explicit Mapping',
    summary: 'Agent memilih pemilik kontak akun lama secara eksplisit sebelum mengisi data migrasi.',
    steps: ['Cek akun lama', 'Pilih kontak milik Anak/Orang Tua', 'Cek No. HP orang tua', 'Review lalu pilih metode bayar'],
  },
  {
    id: '3',
    label: 'Opsi 3',
    title: 'Wizard Tujuan Pembelian',
    summary: 'Agent dipandu menentukan akun dan profil tujuan paket, sambil mengonversi akun lama bila diperlukan.',
    steps: ['Cari customer', 'Tentukan tujuan paket', 'Isi data orang tua', 'Isi profil anak', 'Review pembelian'],
  },
]

function isPrototypeOptionId(value: string | null): value is PrototypeOptionId {
  return value === '1' || value === '2' || value === '3'
}

function getInitialPrototypeOption(): PrototypeOptionId {
  if (typeof window === 'undefined') return '1'

  const option = new URLSearchParams(window.location.search).get('option')
  return isPrototypeOptionId(option) ? option : '1'
}

const existingAccount = {
  leadStatus: 'assigned-to-me' as LeadAssignmentStatus,
  lastLoginAt: '13 Mei 2026, 10:28',
  name: 'Keisha Azzahra',
  email: 'keisha.azzahra@studentmail.test',
  phone: '081234567890',
  serial: 'AZMIGD1L0YPTBMAR',
}

const registeredParentAccount = {
  name: 'Dimas Pratama',
  phone: '081298765432',
  serial: 'AZMIGD1L0YPTDMSP',
}

const parentAccountWithSingleChild: ParentProfileAccount = {
  name: 'Nadia Rahma',
  phone: '081381240015',
  serial: 'AZMIGD1L0YPTB015',
  profiles: [
    { contact: '081234700111', grade: 'Kelas 6 SD', id: 'rafa', lastLoginAt: '13 Mei 2026, 08:12', name: 'Rafa Alfarizi', serial: 'AZMIGD1L0YPTB111' },
  ],
}

const parentAccountWithChildren: ParentProfileAccount = {
  name: 'Agus Salim',
  phone: '081276540022',
  serial: 'AZMIGD1L0YPTB022',
  profiles: [
    { contact: '081234700555', grade: 'Kelas 5 SD', id: 'xiera', lastLoginAt: '12 Mei 2026, 19:42', name: 'Xiera Gentika', serial: 'AZMIGD1L0YPTXIGT' },
    { contact: '081234700555', grade: 'Kelas 8 SMP', hasActivePackage: true, id: 'salsabila', lastLoginAt: '11 Mei 2026, 20:18', name: 'Salsabila Putri', packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'], serial: 'AZMIGD1L0YPTSBPT' },
  ],
}

const parentAccountWithoutChildren: ParentProfileAccount = {
  name: 'Maya Lestari',
  phone: '081399880044',
  profiles: [],
  serial: 'AZMIGD1L0YPTB044',
}

const singleChildProfileSearchResults: ChildProfile[] = [
  {
    contact: '081234700111',
    grade: 'Kelas 6 SD',
    id: 'child-rafa-nadia',
    leadStatus: 'assigned-to-me',
    lastLoginAt: '13 Mei 2026, 08:12',
    name: 'Rafa Alfarizi',
    parentName: parentAccountWithSingleChild.name,
    parentPhone: parentAccountWithSingleChild.phone,
    parentSerial: parentAccountWithSingleChild.serial,
    serial: 'AZMIGD1L0YPTB111',
  },
]

const sameParentChildProfileSearchResults: ChildProfile[] = [
  {
    contact: '081234700555',
    grade: 'Kelas 7 SMP',
    id: 'child-xiera-agus',
    leadStatus: 'assigned-to-me',
    lastLoginAt: '12 Mei 2026, 19:42',
    name: 'Xiera Gentika',
    parentName: parentAccountWithChildren.name,
    parentPhone: parentAccountWithChildren.phone,
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTXIGT',
  },
  {
    contact: '081234700555',
    grade: 'Kelas 8 SMP',
    hasActivePackage: true,
    id: 'child-salsabila-agus-same',
    leadStatus: 'no-lead',
    lastLoginAt: '11 Mei 2026, 20:18',
    name: 'Salsabila Putri',
    packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'],
    parentName: parentAccountWithChildren.name,
    parentPhone: parentAccountWithChildren.phone,
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTSBPT',
  },
]

const crossParentChildProfileSearchResults: ChildProfile[] = [
  {
    contact: '081234700666',
    grade: 'Kelas 6 SD',
    id: 'child-rafa-nadia-cross',
    leadStatus: 'no-lead',
    lastLoginAt: '13 Mei 2026, 08:12',
    name: 'Rafa Alfarizi',
    parentName: parentAccountWithSingleChild.name,
    parentPhone: parentAccountWithSingleChild.phone,
    parentSerial: parentAccountWithSingleChild.serial,
    serial: 'AZMIGD1L0YPTRAXP',
  },
  {
    contact: '081234700666',
    grade: 'Kelas 8 SMP',
    hasActivePackage: true,
    id: 'child-salsabila-agus-cross',
    leadStatus: 'assigned-to-me',
    lastLoginAt: '11 Mei 2026, 20:18',
    name: 'Salsabila Putri',
    packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'],
    parentName: parentAccountWithChildren.name,
    parentPhone: parentAccountWithChildren.phone,
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTSBXP',
  },
  {
    contact: '081234700666',
    grade: 'Kelas 10 SMA',
    id: 'child-keisha-ratih',
    leadStatus: 'no-lead',
    lastLoginAt: '10 Mei 2026, 21:03',
    name: 'Keisha Azzahra',
    parentName: 'Ratih Pramesti',
    parentPhone: '081217003388',
    parentSerial: 'AZMIGD1L0YPTRTPR',
    serial: 'AZMIGD1L0YPTKZZA',
  },
]

const mixedChildProfileSearchResults: ChildProfile[] = [
  {
    contact: '081234700777',
    grade: 'Kelas 5 SD',
    id: 'child-xiera-agus-mixed',
    leadStatus: 'assigned-to-me',
    lastLoginAt: '12 Mei 2026, 19:42',
    name: 'Xiera Gentika',
    parentName: parentAccountWithChildren.name,
    parentPhone: '081234700777',
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTXIMX',
  },
  {
    contact: '081234700777',
    grade: 'Kelas 8 SMP',
    hasActivePackage: true,
    id: 'child-salsabila-agus',
    leadStatus: 'no-lead',
    lastLoginAt: '11 Mei 2026, 20:18',
    name: 'Salsabila Putri',
    packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'],
    parentName: parentAccountWithChildren.name,
    parentPhone: '081234700777',
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTSBMX',
  },
]

const oldAccountChildProfileContactMatches: ChildProfile[] = [
  {
    contact: '081234700888',
    grade: 'Kelas 9 SMP',
    hasActivePackage: true,
    id: 'child-bima-old-account-overlap',
    leadStatus: 'no-lead',
    lastLoginAt: '12 Mei 2026, 18:36',
    name: 'Bima Arya',
    packageNames: ['ruangbelajar SMP 1 Tahun'],
    parentName: parentAccountWithChildren.name,
    parentPhone: parentAccountWithChildren.phone,
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTB888',
  },
]

const childProfileSearchResults: ChildProfile[] = [
  ...oldAccountChildProfileContactMatches,
  ...singleChildProfileSearchResults,
  ...sameParentChildProfileSearchResults,
  ...crossParentChildProfileSearchResults,
  ...mixedChildProfileSearchResults,
].filter((profile, index, profiles) => profiles.findIndex((item) => item.id === profile.id) === index)

function getRegisteredParentAccount(phone: string): Pick<ParentProfileAccount, 'name' | 'phone' | 'serial'> | null {
  const normalizedPhone = phone.replace(/\D/g, '')

  if (normalizedPhone === registeredParentAccount.phone || normalizedPhone.includes('765432')) {
    return registeredParentAccount
  }

  if (isParentAccountWithSingleChildPhone(phone)) return parentAccountWithSingleChild
  if (isParentAccountWithChildrenPhone(phone)) return parentAccountWithChildren
  if (isParentAccountWithoutChildrenPhone(phone)) return parentAccountWithoutChildren

  return null
}

function canCheckParentPhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 8
}

function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, '')
}

function normalizeLookupText(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function isSerialLookupInput(value: string) {
  const normalizedValue = normalizeLookupText(value)
  return /[a-z]/i.test(value) && normalizedValue.length >= 8
}

function serialMatchesInput(serial: string | undefined, value: string) {
  if (!serial || !isSerialLookupInput(value)) return false
  const normalizedSerial = normalizeLookupText(serial)
  const normalizedValue = normalizeLookupText(value)
  return normalizedSerial.includes(normalizedValue) || normalizedValue.includes(normalizedSerial)
}

function profileSerialMatchesInput(profile: ChildProfile, value: string) {
  return serialMatchesInput(profile.serial, value)
}

function parentAccountSerialMatchesInput(account: ParentProfileAccount, value: string) {
  return serialMatchesInput(account.serial, value)
}

function getParentUpdateState(account: ParentProfileAccount, parentName: string, parentPhone: string) {
  const nextName = parentName.trim()
  const nextPhone = parentPhone.trim()
  const normalizedNextPhone = normalizePhoneDigits(nextPhone)
  const normalizedCurrentPhone = normalizePhoneDigits(account.phone)
  const nameChanged = Boolean(nextName && nextName !== account.name)
  const phoneChanged = Boolean(normalizedNextPhone && normalizedNextPhone !== normalizedCurrentPhone)
  const changed = nameChanged || phoneChanged
  const registeredAccount = phoneChanged ? getRegisteredParentAccount(nextPhone) : null
  const registeredToOtherParent = Boolean(registeredAccount && registeredAccount.serial !== account.serial)
  const isChildContact = phoneChanged && account.profiles.some((profile) => normalizePhoneDigits(profile.contact ?? '') === normalizedNextPhone)

  return {
    changed,
    nameChanged,
    nextName: nextName || account.name,
    nextPhone: nextPhone || account.phone,
    phoneChanged,
    isChildContact,
    registeredAccount,
    registeredToOtherParent,
  }
}

function isParentAccountWithChildrenPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  return normalizedPhone === parentAccountWithChildren.phone || normalizedPhone.includes('540022') || parentAccountSerialMatchesInput(parentAccountWithChildren, phone)
}

function isParentAccountWithSingleChildPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  return normalizedPhone === parentAccountWithSingleChild.phone || normalizedPhone.includes('240015') || parentAccountSerialMatchesInput(parentAccountWithSingleChild, phone)
}

function isParentAccountWithoutChildrenPhone(phone: string) {
  return phone.replace(/\D/g, '').includes('880044') || parentAccountSerialMatchesInput(parentAccountWithoutChildren, phone)
}

function isParentProfileLookup(lookupState: LookupState) {
  return lookupState === 'existing-parent-single-child' || lookupState === 'existing-parent-with-children' || lookupState === 'existing-parent-empty'
}

function isOldAccountLookup(lookupState: LookupState) {
  return lookupState === 'existing-old-account' || lookupState === 'existing-old-account-with-child-profile-contact'
}

function isLookupNoticeState(lookupState: LookupState) {
  return lookupState === 'existing-not-registered'
    || lookupState === 'existing-child-phone'
    || lookupState === 'new-available'
    || lookupState === 'new-registered'
}

function isSearchResolutionLookup(lookupState: LookupState) {
  return lookupState === 'existing-child-profile-contact'
    || lookupState === 'existing-child-profiles-same-parent'
    || lookupState === 'existing-child-profiles-cross-parent'
    || lookupState === 'existing-multiple-matches'
}

function getLookupParentAccount(lookupState: LookupState): ParentProfileAccount | null {
  if (lookupState === 'existing-parent-single-child') return parentAccountWithSingleChild
  if (lookupState === 'existing-parent-with-children') return parentAccountWithChildren
  if (lookupState === 'existing-parent-empty') return parentAccountWithoutChildren

  return null
}

function getParentAccountChildProfiles(account: ParentProfileAccount) {
  return account.profiles.map((profile) => ({
    ...profile,
    parentName: profile.parentName ?? account.name,
    parentPhone: profile.parentPhone ?? account.phone,
    parentSerial: profile.parentSerial ?? account.serial,
  }))
}

function getChildProfileSearchResults(lookupState: LookupState) {
  if (lookupState === 'existing-child-profile-contact') return singleChildProfileSearchResults
  if (lookupState === 'existing-child-profiles-same-parent') return sameParentChildProfileSearchResults
  if (lookupState === 'existing-child-profiles-cross-parent') return crossParentChildProfileSearchResults
  if (lookupState === 'existing-multiple-matches') return mixedChildProfileSearchResults

  const parentAccount = getLookupParentAccount(lookupState)
  if (parentAccount) return getParentAccountChildProfiles(parentAccount)

  return []
}

function getOldAccountProfileContactMatches(lookupState: LookupState) {
  if (lookupState === 'existing-old-account-with-child-profile-contact') return oldAccountChildProfileContactMatches
  return []
}

function getParentAccountFromChildProfile(profile: ChildProfile): ParentProfileAccount {
  return {
    name: profile.parentName ?? 'Orang Tua',
    phone: profile.parentPhone ?? '',
    profiles: [profile],
    serial: profile.parentSerial ?? '',
  }
}

function normalizeProfileName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getDuplicateProfileMatches(profiles: ChildProfile[], childName: string) {
  const normalizedChildName = normalizeProfileName(childName)

  if (normalizedChildName.length < 3) return []

  return profiles.filter((profile) => {
    const normalizedProfileName = normalizeProfileName(profile.name)

    return normalizedProfileName === normalizedChildName
      || normalizedProfileName.includes(normalizedChildName)
      || normalizedChildName.includes(normalizedProfileName)
  })
}

function getActivePackageNames(profile: ChildProfile) {
  if (profile.packageNames?.length) return profile.packageNames
  return profile.packageName ? [profile.packageName] : []
}

function LastLoginLine({ value }: { value?: string }) {
  return <small className="last-login-line">Login terakhir: {value ?? 'Belum ada data'}</small>
}

function ActivePackageLines({ profile }: { profile: ChildProfile }) {
  const packages = getActivePackageNames(profile)

  if (!packages.length) return null

  return (
    <div className="active-package-list" aria-label="Paket aktif">
      <span>Paket aktif</span>
      <ul>
        {packages.map((packageName) => (
          <li key={packageName}>{packageName}</li>
        ))}
      </ul>
    </div>
  )
}

function UserSerial({ match, value }: { match?: string; value?: string }) {
  if (!value) return null

  const serialLabel = `SN ${value}`
  if (serialMatchesInput(value, match ?? '')) return <HighlightedMatch match={match} value={serialLabel} />

  return <span className="user-serial">{serialLabel}</span>
}


function isChildProfileContact(phone: string) {
  return phone.replace(/\D/g, '').includes('700111')
}

function isChildProfileLookupInput(value: string) {
  const normalizedValue = value.trim().toLowerCase()
  const numericValue = normalizedValue.replace(/\D/g, '')

  return numericValue.includes('700111')
    || singleChildProfileSearchResults.some((profile) => profileSerialMatchesInput(profile, value))
    || normalizedValue.includes('rafa.alfarizi')
    || normalizedValue.includes('sn-rafa-2026')
    || normalizedValue.includes('single-profile')
}

function isSameParentChildProfilesInput(value: string) {
  const normalizedValue = value.trim().toLowerCase()
  const numericValue = normalizedValue.replace(/\D/g, '')

  return numericValue.includes('700555')
    || normalizedValue.includes('kakak-adik-agus')
    || normalizedValue.includes('same-parent')
    || normalizedValue.includes('satuparent')
}

function isCrossParentChildProfilesInput(value: string) {
  const normalizedValue = value.trim().toLowerCase()
  const numericValue = normalizedValue.replace(/\D/g, '')

  return numericValue.includes('700666')
    || normalizedValue.includes('lintas-parent')
    || normalizedValue.includes('cross-parent')
    || normalizedValue.includes('bedaparent')
}

function isMultipleMatchInput(value: string) {
  const normalizedValue = value.trim().toLowerCase()
  const numericValue = normalizedValue.replace(/\D/g, '')

  return numericValue.includes('700777')
    || normalizedValue.includes('agus.salim@parent.test')
    || normalizedValue.includes('mixed-parent-profile')
    || normalizedValue.includes('multi')
}

function isOldAccountWithChildProfileContactInput(value: string) {
  const normalizedValue = value.trim().toLowerCase()
  const numericValue = normalizedValue.replace(/\D/g, '')

  return numericValue.includes('700888')
    || oldAccountChildProfileContactMatches.some((profile) => profileSerialMatchesInput(profile, value))
    || normalizedValue.includes('akun-lama-anak-profile')
    || normalizedValue.includes('old-account-overlap')
}

function getWizardStepTitle(step: WizardStep) {
  const titles: Record<WizardStep, string> = {
    1: 'Cari customer',
    2: 'Tujuan paket',
    3: 'Data orang tua',
    4: 'Profil anak',
    5: 'Review pembelian',
  }

  return titles[step]
}

function App() {
  const [prototypeOption, setPrototypeOption] = useState<PrototypeOptionId>(getInitialPrototypeOption)
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [lookupState, setLookupState] = useState<LookupState>('idle')
  const [phone, setPhone] = useState('')
  const [usesParentIdentity, setUsesParentIdentity] = useState(false)
  const [contactOwner, setContactOwner] = useState<ContactOwner>(null)
  const [profileTarget, setProfileTarget] = useState<ProfileTarget>(null)
  const [selectedChildProfileId, setSelectedChildProfileId] = useState('')
  const [selectedChildSearchProfileId, setSelectedChildSearchProfileId] = useState('')
  const [legacyAccountSelected, setLegacyAccountSelected] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [parentPhone, setParentPhone] = useState('')
  const [parentName, setParentName] = useState('')
  const [childName, setChildName] = useState('')
  const [childPhone, setChildPhone] = useState('')
  const [childEmail, setChildEmail] = useState('')
  const [grade, setGrade] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [consent, setConsent] = useState(false)
  const [, setPackageIntent] = useState<PackageIntent>(null)
  const [duplicateProfileAcknowledged, setDuplicateProfileAcknowledged] = useState(false)
  const [lookupPickerOpen, setLookupPickerOpen] = useState(false)
  const [parentUpdateName, setParentUpdateName] = useState('')
  const [parentUpdatePhone, setParentUpdatePhone] = useState('')

  const isExistingFlow = accountStatus === 'existing'
  const isOptionTwo = prototypeOption === '2'
  const isOptionThree = prototypeOption === '3'
  const usesMappingDecision = isOptionTwo || isOptionThree
  const hasContactOwnerDecision = !usesMappingDecision || contactOwner !== null
  const parentContactSelected = usesMappingDecision ? contactOwner === 'parent' : usesParentIdentity
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const selectedChildSearchProfile = childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId) ?? null
  const isOldAccountOverlapLookup = lookupState === 'existing-old-account-with-child-profile-contact'
  const selectedSearchParentAccount = selectedChildSearchProfile ? getParentAccountFromChildProfile(selectedChildSearchProfile) : null
  const parentAccountForUpdate = parentLookupAccount ?? selectedSearchParentAccount
  const parentUpdateState = parentAccountForUpdate ? getParentUpdateState(parentAccountForUpdate, parentUpdateName, parentUpdatePhone) : null
  const parentUpdateBlocked = Boolean(parentUpdateState?.registeredToOtherParent)
  const selectedChildProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedChildProfileId) ?? selectedChildSearchProfile
  const shouldCreateProfileForParent = Boolean(parentLookupAccount && profileTarget === 'new')
  const duplicateProfileMatches = parentLookupAccount && shouldCreateProfileForParent ? getDuplicateProfileMatches(parentLookupAccount.profiles, childName) : []
  const duplicateProfileBlocking = duplicateProfileMatches.length > 0 && !duplicateProfileAcknowledged
  const searchProfileReady = Boolean((isSearchResolutionLookup(lookupState) || isOldAccountOverlapLookup) && selectedChildSearchProfile)
  const showMigrationForm = isExistingFlow && isOldAccountLookup(lookupState) && hasContactOwnerDecision && legacyAccountSelected
  const showNewAccountForm = accountStatus === 'new' && lookupState === 'new-available'
  const effectiveParentPhone = parentAccountForUpdate ? parentUpdateState?.nextPhone ?? parentAccountForUpdate.phone : showNewAccountForm ? parentPhone || phone : parentContactSelected ? phone : parentPhone
  const effectiveParentAccount = parentContactSelected || parentAccountForUpdate ? null : getRegisteredParentAccount(effectiveParentPhone)
  const effectiveParentName = parentAccountForUpdate ? parentUpdateState?.nextName ?? parentAccountForUpdate.name : effectiveParentAccount?.name || parentName || ''
  const effectiveChildName = selectedChildProfile?.name ?? childName
  const parentDataReady = Boolean(canCheckParentPhone(effectiveParentPhone))
  const multipleMatchReady = Boolean(lookupState === 'existing-multiple-matches' && selectedChildSearchProfile)
  const oldAccountOverlapReady = Boolean(isOldAccountOverlapLookup && (selectedChildSearchProfile || legacyAccountSelected))
  const childProfileFormReady = Boolean(childName.trim() && grade)
  const childDataReady = Boolean(effectiveChildName.trim() && (selectedChildProfile ? true : grade))
  const parentProfileTargetReady = Boolean(
    parentLookupAccount
    && !parentUpdateBlocked
    && (profileTarget === 'existing' ? selectedChildProfile : shouldCreateProfileForParent && childProfileFormReady && !duplicateProfileBlocking),
  )
  const migrationFormReady = Boolean(showMigrationForm && parentDataReady && childDataReady)
  const newAccountFormReady = Boolean(
    showNewAccountForm
    && canCheckParentPhone(effectiveParentPhone)
    && childName.trim()
    && grade,
  )
  const invoiceDetailReady = Boolean(parentProfileTargetReady || migrationFormReady || newAccountFormReady)
  const dynamicWizardSteps = getDynamicWizardSteps({
    accountStatus,
    legacyAccountSelected,
    lookupState,
    profileTarget,
    selectedChildProfileId,
    selectedChildSearchProfileId,
    wizardStep,
  })
  const currentWizardIndex = Math.max(0, dynamicWizardSteps.findIndex((step) => step.id === wizardStep))

  const cta = useMemo(() => {
    if (isOptionThree) {
      if (wizardStep === 1) {
        if (isOldAccountOverlapLookup) {
          if (selectedChildSearchProfile) return { label: 'Review Tujuan Paket', disabled: parentUpdateBlocked }
          if (legacyAccountSelected) return { label: 'Lanjut ke Mapping', disabled: false }
          return { label: 'Pilih Tujuan Paket', disabled: true }
        }
        if (isOldAccountLookup(lookupState)) return { label: legacyAccountSelected ? 'Lanjut ke Mapping' : 'Pilih Akun Lama', disabled: !legacyAccountSelected }
        if (isParentProfileLookup(lookupState)) {
          if (profileTarget === 'existing' && selectedChildProfile) return { label: 'Review Tujuan Paket', disabled: parentUpdateBlocked }
          if (profileTarget === 'new') return { label: 'Lanjut Isi Anak', disabled: false }
          return { label: 'Pilih Tujuan Paket', disabled: true }
        }
        if (lookupState === 'existing-child-profile-contact') return { label: selectedChildSearchProfile ? 'Review Tujuan Paket' : 'Pilih Anak', disabled: !searchProfileReady || parentUpdateBlocked }
        if (lookupState === 'existing-child-profiles-same-parent' || lookupState === 'existing-child-profiles-cross-parent') return { label: selectedChildSearchProfile ? 'Review Tujuan Paket' : 'Pilih Anak', disabled: !searchProfileReady || parentUpdateBlocked }
        if (lookupState === 'existing-multiple-matches') return { label: selectedChildSearchProfile ? 'Review Tujuan Paket' : 'Pilih Hasil Pencarian', disabled: !multipleMatchReady || parentUpdateBlocked }
        if (accountStatus === 'new' && lookupState === 'new-available') return { label: 'Lanjut Isi Data Orang Tua', disabled: false }
        if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone' || lookupState === 'new-registered') {
          return { label: 'Ikuti Instruksi', disabled: true }
        }

        return { label: accountStatus ? 'Cek Akun Dulu' : 'Pilih Status Akun', disabled: true }
      }

      if (wizardStep === 2 && parentLookupAccount) {
        if (profileTarget === 'existing') return { label: 'Review Tujuan Paket', disabled: !selectedChildProfile || parentUpdateBlocked }
        if (profileTarget === 'new') return { label: 'Lanjut Isi Anak', disabled: false }
        return { label: 'Pilih Profil Tujuan', disabled: true }
      }
      if (wizardStep === 2) return { label: 'Lanjut Isi Data Orang Tua', disabled: contactOwner === null }
      if (wizardStep === 3) return { label: 'Lanjut Isi Anak', disabled: !parentDataReady }
      if (wizardStep === 4) return { label: parentLookupAccount ? (duplicateProfileBlocking ? 'Cek Profil Mirip' : 'Review Tujuan Paket') : 'Review Migrasi', disabled: parentLookupAccount ? !childProfileFormReady || duplicateProfileBlocking : !childDataReady }
      return { label: 'Lanjut Pilih Metode Bayar', disabled: !consent }
    }

    if (accountStatus === 'new' && lookupState === 'new-available') {
      return { label: newAccountFormReady ? 'Review' : 'Lengkapi Data Akun', disabled: !newAccountFormReady }
    }
    if (accountStatus === 'new' && lookupState === 'new-registered') return { label: 'Ikuti Instruksi', disabled: true }
    if (lookupState === 'idle') return { label: 'Cek Akun Dulu', disabled: true }
    if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone') return { label: 'Ikuti Instruksi', disabled: true }
    if (lookupState === 'existing-child-profile-contact') {
      return { label: selectedChildSearchProfile ? 'Review' : 'Pilih Anak', disabled: !searchProfileReady || parentUpdateBlocked }
    }
    if (lookupState === 'existing-child-profiles-same-parent' || lookupState === 'existing-child-profiles-cross-parent') {
      return { label: selectedChildSearchProfile ? 'Review' : 'Pilih Anak', disabled: !searchProfileReady || parentUpdateBlocked }
    }
    if (lookupState === 'existing-multiple-matches') {
      return { label: selectedChildSearchProfile ? 'Review' : 'Pilih Hasil Pencarian', disabled: !multipleMatchReady || parentUpdateBlocked }
    }
    if (isOldAccountOverlapLookup) {
      if (selectedChildSearchProfile) return { label: 'Review', disabled: parentUpdateBlocked }
      if (legacyAccountSelected) return { label: migrationFormReady ? 'Review' : 'Lengkapi Data Migrasi', disabled: !migrationFormReady }
      return { label: 'Pilih Tujuan Paket', disabled: true }
    }
    if (parentLookupAccount) {
      return { label: parentProfileTargetReady ? 'Review' : duplicateProfileBlocking ? 'Cek Profil Mirip' : 'Tentukan Profil Tujuan', disabled: !parentProfileTargetReady }
    }
    if (isOldAccountLookup(lookupState)) {
      if (!legacyAccountSelected) return { label: 'Pilih Akun Lama', disabled: true }
      if (usesMappingDecision && contactOwner === null) {
        return { label: isOptionThree ? 'Pilih Posisi Data' : 'Pilih Pemilik Kontak', disabled: true }
      }

      return { label: migrationFormReady ? 'Review' : 'Lengkapi Data Migrasi', disabled: !migrationFormReady }
    }
    return { label: 'Pilih Status Akun', disabled: true }
  }, [accountStatus, childDataReady, childProfileFormReady, consent, contactOwner, duplicateProfileBlocking, isOldAccountOverlapLookup, isOptionThree, legacyAccountSelected, lookupState, migrationFormReady, multipleMatchReady, newAccountFormReady, parentDataReady, parentLookupAccount, parentProfileTargetReady, profileTarget, searchProfileReady, selectedChildProfile, selectedChildSearchProfile, usesMappingDecision, wizardStep, parentUpdateBlocked])

  const disabledReason = (() => {
    if (!cta.disabled || isOptionThree) return null
    if (!accountStatus) return 'Pilih status akun customer'
    if (lookupState === 'idle') return 'Input No. HP atau user serial lalu cek akun'
    if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone' || lookupState === 'new-registered') return 'Ikuti instruksi pada hasil pencarian'
    if (isOldAccountOverlapLookup && !oldAccountOverlapReady) return 'Pilih akun lama atau Anak tujuan paket'
    if (isSearchResolutionLookup(lookupState) && !selectedChildSearchProfile) return 'Pilih Anak tujuan paket'
    if (parentUpdateBlocked) return 'Periksa No. HP Orang Tua yang akan diperbarui'
    if (parentLookupAccount && duplicateProfileBlocking) return 'Cek profil mirip sebelum lanjut'
    if (parentLookupAccount && !parentProfileTargetReady) return 'Tentukan Anak tujuan paket'
    if (isOldAccountLookup(lookupState) && !migrationFormReady) return 'Lengkapi data Orang Tua dan Anak'
    if (accountStatus === 'new' && !newAccountFormReady) return 'Lengkapi data Orang Tua dan Anak baru'
    return cta.label
  })()

  const handleAccountStatusChange = (value: AccountStatus | null) => {
    setAccountStatus(value)
    setLookupState('idle')
    setPhone('')
    setUsesParentIdentity(false)
    setContactOwner(null)
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setLegacyAccountSelected(false)
    setParentPhone('')
    setParentName('')
    setChildName('')
    setChildPhone('')
    setChildEmail('')
    setGrade('')
    setWizardStep(1)
    setConsent(false)
    setPackageIntent(null)
    setDuplicateProfileAcknowledged(false)
    setLookupPickerOpen(false)
  }

  const resetFlowState = () => {
    setAccountStatus(null)
    setLookupState('idle')
    setPhone('')
    setUsesParentIdentity(false)
    setContactOwner(null)
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setLegacyAccountSelected(false)
    setWizardStep(1)
    setParentPhone('')
    setParentName('')
    setChildName('')
    setChildPhone('')
    setChildEmail('')
    setGrade('')
    setReviewOpen(false)
    setDoneOpen(false)
    setConsent(false)
    setPackageIntent(null)
    setDuplicateProfileAcknowledged(false)
    setLookupPickerOpen(false)
  }

  const prefillLegacyChildData = () => {
    setChildName(existingAccount.name)
    setChildPhone(phone)
    setChildEmail(existingAccount.email)
  }

  const clearLegacyChildData = () => {
    setChildName('')
    setChildPhone('')
    setChildEmail('')
  }

  const handleLegacyAccountSelectedChange = (value: boolean) => {
    setLegacyAccountSelected(value)
    if (!value) return

    if (usesParentIdentity || contactOwner === 'parent') {
      clearLegacyChildData()
      return
    }

    prefillLegacyChildData()
  }

  const handleUsesParentIdentityChange = (value: boolean) => {
    setUsesParentIdentity(value)

    if (!isOldAccountLookup(lookupState) || !legacyAccountSelected) return

    if (value) {
      clearLegacyChildData()
      setParentPhone(phone)
      return
    }

    if (normalizePhoneDigits(parentPhone) === normalizePhoneDigits(phone)) setParentPhone('')
    prefillLegacyChildData()
  }

  const handleContactOwnerChange = (value: ContactOwner) => {
    setContactOwner(value)

    if (!isOldAccountLookup(lookupState) || !legacyAccountSelected) return

    if (value === 'parent') {
      clearLegacyChildData()
      return
    }

    if (value === 'child') prefillLegacyChildData()
  }

  const handleChildNameChange = (value: string) => {
    setChildName(value)
    setDuplicateProfileAcknowledged(false)
  }

  const handleProfileTargetChange = (value: ProfileTarget) => {
    setProfileTarget(value)
    setPackageIntent(null)
    if (value !== 'new') setDuplicateProfileAcknowledged(false)
  }

  const handleSelectedChildProfileIdChange = (value: string) => {
    setSelectedChildProfileId(value)
    setPackageIntent(null)
    setDuplicateProfileAcknowledged(false)
  }

  const handleSelectedChildSearchProfileIdChange = (value: string) => {
    setSelectedChildSearchProfileId(value)
    setLegacyAccountSelected(false)
    setPackageIntent(null)
  }

  const handlePrototypeOptionChange = (option: PrototypeOptionId) => {
    setPrototypeOption(option)
    resetFlowState()

    const url = new URL(window.location.href)
    url.searchParams.set('option', option)
    window.history.pushState({}, '', url)
  }

  const checkNumber = () => {
    const normalizedPhone = phone.replace(/\D/g, '')

    setContactOwner(null)
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setLegacyAccountSelected(false)
    setConsent(false)
    setPackageIntent(null)
    setDuplicateProfileAcknowledged(false)
    setLookupPickerOpen(false)
    setParentUpdateName('')
    setParentUpdatePhone('')

    if (!phone.trim()) {
      setLookupState('idle')
      return
    }

    if (accountStatus === 'existing') {
      if (serialMatchesInput(existingAccount.serial, phone)) {
        setLookupState('existing-old-account')
        setLookupPickerOpen(true)
        return
      }

      if (isOldAccountWithChildProfileContactInput(phone)) {
        setLookupState('existing-old-account-with-child-profile-contact')
        setLookupPickerOpen(true)
        return
      }

      if (isMultipleMatchInput(phone)) {
        setLookupState('existing-multiple-matches')
        setLookupPickerOpen(true)
        return
      }

      if (isSameParentChildProfilesInput(phone)) {
        setLookupState('existing-child-profiles-same-parent')
        setLookupPickerOpen(true)
        return
      }

      if (isCrossParentChildProfilesInput(phone)) {
        setLookupState('existing-child-profiles-cross-parent')
        setLookupPickerOpen(true)
        return
      }

      if (isChildProfileLookupInput(phone)) {
        setLookupState('existing-child-profile-contact')
        setLookupPickerOpen(true)
        return
      }

      if (isParentAccountWithSingleChildPhone(phone)) {
        setLookupState('existing-parent-single-child')
        setLookupPickerOpen(true)
        return
      }

      if (isParentAccountWithChildrenPhone(phone)) {
        setLookupState('existing-parent-with-children')
        setLookupPickerOpen(true)
        return
      }

      if (isParentAccountWithoutChildrenPhone(phone)) {
        setLookupState('existing-parent-empty')
        setLookupPickerOpen(true)
        return
      }

      if (normalizedPhone === '089900001234' || normalizedPhone.includes('90001234') || isSerialLookupInput(phone)) {
        setLookupState('existing-not-registered')
        setLookupPickerOpen(true)
        return
      }

      setLookupState('existing-old-account')
      setLookupPickerOpen(true)
      return
    }

    if (isSerialLookupInput(phone)) {
      setLookupState('new-registered')
      setLookupPickerOpen(true)
      return
    }

    if (isChildProfileContact(phone)) {
      setLookupState('new-available')
      setLookupPickerOpen(true)
      return
    }

    if (
      normalizedPhone.includes('222')
      || isParentAccountWithSingleChildPhone(phone)
      || isParentAccountWithChildrenPhone(phone)
      || isParentAccountWithoutChildrenPhone(phone)
    ) {
      setLookupState('new-registered')
      setLookupPickerOpen(true)
      return
    }

    setLookupState('new-available')
    setLookupPickerOpen(true)
  }

  const handleBottomCtaClick = () => {
    if (!isOptionThree) {
      setReviewOpen(true)
      return
    }

    if (wizardStep === 1) {
      if (searchProfileReady || (parentLookupAccount && profileTarget === 'existing' && selectedChildProfile)) {
        setWizardStep(5)
        return
      }

      if (parentLookupAccount && profileTarget === 'new') {
        setWizardStep(4)
        return
      }

      setWizardStep(accountStatus === 'new' ? 3 : 2)
      return
    }

    if (wizardStep === 2) {
      setWizardStep(parentLookupAccount || selectedChildSearchProfile ? (profileTarget === 'existing' ? 5 : 4) : 3)
      return
    }

    if (wizardStep === 3) {
      setWizardStep(4)
      return
    }

    if (wizardStep === 4) {
      setWizardStep(5)
      return
    }

    setDoneOpen(true)
  }

  return (
    <main className="app-shell">
      <section className="device-shell" aria-label="Prototype opsi 1">
        <AppChrome
          selected={prototypeOption}
          title={isOptionThree ? 'Tujuan Pembelian' : 'Draft Invoice'}
          onOptionChange={handlePrototypeOptionChange}
        />

        <div className="content-stack">
          {!isOptionThree && <OrderCard compact={!invoiceDetailReady} />}
          <DiscountCard />
          <PaymentDetailCard />
          {prototypeOption === '1' || prototypeOption === '2' || prototypeOption === '3' ? (
            <PurchasePurposeCard
              accountStatus={accountStatus}
              childName={childName}
              consent={consent}
              contactOwner={contactOwner}
              checkNumber={checkNumber}
              grade={grade}
              duplicateProfileAcknowledged={duplicateProfileAcknowledged}
              duplicateProfileMatches={duplicateProfileMatches}
              isBeforeAfterMapping={isOptionThree}
              isExplicitMapping={isOptionTwo}
              legacyAccountSelected={legacyAccountSelected}
              lookupState={lookupState}
              lookupPickerOpen={lookupPickerOpen}
              setWizardStep={setWizardStep}
              childEmail={childEmail}
              childPhone={childPhone}
              profileTarget={profileTarget}
              selectedChildProfileId={selectedChildProfileId}
              selectedChildSearchProfileId={selectedChildSearchProfileId}
              setLookupState={setLookupState}
              setLookupPickerOpen={setLookupPickerOpen}
              parentName={parentName}
              parentPhone={parentPhone}
              parentUpdateName={parentUpdateName}
                parentUpdatePhone={parentUpdatePhone}
              phone={phone}
              setAccountStatus={handleAccountStatusChange}
              setChildEmail={setChildEmail}
              setConsent={setConsent}
              setChildName={handleChildNameChange}
              setChildPhone={setChildPhone}
              setContactOwner={handleContactOwnerChange}
              setGrade={setGrade}
              setLegacyAccountSelected={handleLegacyAccountSelectedChange}
              setParentPhone={setParentPhone}
                setParentUpdatePhone={setParentUpdatePhone}
              setPhone={setPhone}
              setProfileTarget={handleProfileTargetChange}
              setSelectedChildProfileId={handleSelectedChildProfileIdChange}
              setSelectedChildSearchProfileId={handleSelectedChildSearchProfileIdChange}
              setDuplicateProfileAcknowledged={setDuplicateProfileAcknowledged}
              setPackageIntent={setPackageIntent}
              setUsesParentIdentity={handleUsesParentIdentityChange}
              showMigrationForm={showMigrationForm}
              showNewAccountForm={showNewAccountForm}
              usesParentIdentity={parentContactSelected}
              wizardStep={wizardStep}
            />
          ) : (
            <PrototypeConceptCard option={prototypeOptions.find((option) => option.id === prototypeOption) ?? prototypeOptions[0]} />
          )}
        </div>

        <BottomCta
          contextLabel={isOptionThree ? (dynamicWizardSteps.length === 1 ? 'Langkah saat ini' : `Tahap ${currentWizardIndex + 1}/${dynamicWizardSteps.length}`) : disabledReason ? 'Yang perlu dilakukan' : undefined}
          contextValue={isOptionThree ? getWizardStepTitle(wizardStep) : disabledReason ?? undefined}
          disabled={cta.disabled}
          label={cta.label}
          onClick={handleBottomCtaClick}
        />

        {reviewOpen && (
          <ReviewSheet
            accountStatus={accountStatus}
            consent={consent}
            lookupState={lookupState}
            phone={phone}
            childName={childName}
            grade={grade}
            parentName={effectiveParentName || parentName}
            parentPhone={effectiveParentPhone || parentPhone}
            profileTarget={profileTarget}
            selectedChildProfileId={selectedChildProfileId}
            selectedChildSearchProfileId={selectedChildSearchProfileId}
            setConsent={setConsent}
            usesParentIdentity={parentContactSelected}
            onClose={() => setReviewOpen(false)}
            onContinue={() => {
              setReviewOpen(false)
              setDoneOpen(true)
            }}
          />
        )}

        {doneOpen && <DoneSheet onClose={() => setDoneOpen(false)} />}

      </section>
    </main>
  )
}

function AppChrome({ selected, title = 'Draft Invoice', onOptionChange }: { selected: PrototypeOptionId; title?: string; onOptionChange: (option: PrototypeOptionId) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleOptionClick = (option: PrototypeOptionId) => {
    onOptionChange(option)
    setMenuOpen(false)
  }

  return (
    <header className="invoice-header compact-header">
      <button className="back-button" type="button" aria-label="Kembali">
        <ArrowLeft size={19} />
      </button>
      <h1>{title}</h1>
      <div className="prototype-menu">
        <button className="prototype-menu-trigger" type="button" aria-expanded={menuOpen} aria-label="Pilih opsi prototype" onClick={() => setMenuOpen(!menuOpen)}>
          <MoreVertical size={18} />
        </button>
        {menuOpen && (
          <div className="prototype-menu-popover" role="menu" aria-label="Opsi prototype">
            <span>Mode Prototype</span>
            {prototypeOptions.map((option) => (
              <button className={option.id === selected ? 'active' : ''} key={option.id} type="button" role="menuitem" onClick={() => handleOptionClick(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

function SectionCard({ children, className = '', title }: { children: ReactNode; className?: string; title: string }) {
  return (
    <section className={`card ${className}`.trim()}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function StagePanel({ children, className = '', step, title }: { children: ReactNode; className?: string; step: string; title: string }) {
  return (
    <div className={`stage-block ${className}`.trim()}>
      <p className="stage-label">{step}</p>
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function Callout({ children, className = '', icon, showIcon = true, variant = 'info' }: { children: ReactNode; className?: string; icon?: ReactNode; showIcon?: boolean; variant?: CalloutVariant }) {
  return (
    <div className={`callout ${variant} ${className}`.trim()}>
      {showIcon && (icon ?? <Info size={15} />)}
      <div>{children}</div>
    </div>
  )
}

function PointList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="point-list">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  )
}

function OrderCard({ compact = false }: { compact?: boolean }) {
  return (
    <SectionCard className={compact ? 'order-card compact-order-card' : 'order-card'} title="Detail Pemesanan">
      <FieldBlock label="Nama Paket">
        <p>ruangbelajar SMA/SMK 1 Tahun</p>
      </FieldBlock>
      {!compact && (
        <FieldBlock label="Deskripsi">
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <IconText icon={<CheckCircle2 size={13} />} key={benefit}>{benefit}</IconText>
            ))}
          </div>
        </FieldBlock>
      )}
      {compact && <small className="compact-invoice-note">Kode diskon dan ringkasan pembayaran bisa disiapkan sebelum review.</small>}
      {!compact && <PriceLine />}
    </SectionCard>
  )
}

function FieldBlock({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="field-block">
      <h3>{label}</h3>
      {children}
    </div>
  )
}

function IconText({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="icon-text">
      {icon}
      <span>{children}</span>
    </div>
  )
}

function PriceLine() {
  return (
    <div className="price-line">
      <span className="discount-badge">Diskon 60%</span>
      <div>
        <del>Rp1.200.000</del>
        <strong>Rp889.000</strong>
      </div>
    </div>
  )
}

function PrototypeConceptCard({ option }: { option: typeof prototypeOptions[number] }) {
  return (
    <SectionCard className="concept-card" title={option.title}>
      <Callout>
        <strong>Konsep belum dibangun</strong>
        <PointList items={option.steps} />
      </Callout>
      <div className="concept-flow">
        {option.steps.map((step, index) => (
          <div className="concept-step" key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function PurchasePurposeCard({
  accountStatus,
  checkNumber,
  childEmail,
  childName,
  childPhone,
  consent,
  contactOwner,
  duplicateProfileAcknowledged,
  duplicateProfileMatches,
  grade,
  isBeforeAfterMapping,
  isExplicitMapping,
  legacyAccountSelected,
  lookupState,
  lookupPickerOpen,
  parentName,
  parentPhone,
  parentUpdateName,
  parentUpdatePhone,
  phone,
  profileTarget,
  selectedChildProfileId,
  selectedChildSearchProfileId,
  setAccountStatus,
  setChildEmail,
  setChildName,
  setChildPhone,
  setConsent,
  setContactOwner,
  setDuplicateProfileAcknowledged,
  setGrade,
  setLegacyAccountSelected,
  setLookupState,
  setLookupPickerOpen,
  setParentPhone,
  setParentUpdatePhone,
  setPhone,
  setPackageIntent,
  setProfileTarget,
  setSelectedChildProfileId,
  setSelectedChildSearchProfileId,
  setUsesParentIdentity,
  setWizardStep,
  showMigrationForm,
  showNewAccountForm,
  usesParentIdentity,
  wizardStep,
}: PurchasePurposeCardProps) {
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const selectedChildSearchProfile = childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId) ?? null
  const selectedSearchParentAccount = selectedChildSearchProfile ? getParentAccountFromChildProfile(selectedChildSearchProfile) : null
  const parentLookupSelectionReady = Boolean(parentLookupAccount && (profileTarget === 'new' || (profileTarget === 'existing' && selectedChildProfileId)))

  if (isBeforeAfterMapping) {
    return (
      <SectionCard className="purpose-card wizard-card" title="Tentukan Tujuan Pembelian Paket">
        <OptionThreeWizard
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          childEmail={childEmail}
          childName={childName}
          childPhone={childPhone}
          consent={consent}
          contactOwner={contactOwner}
          grade={grade}
          duplicateProfileAcknowledged={duplicateProfileAcknowledged}
          duplicateProfileMatches={duplicateProfileMatches}
          legacyAccountSelected={legacyAccountSelected}
          lookupState={lookupState}
          lookupPickerOpen={lookupPickerOpen}
          parentName={parentName}
          parentPhone={parentPhone}
          parentUpdateName={parentUpdateName}
          parentUpdatePhone={parentUpdatePhone}
          phone={phone}
          profileTarget={profileTarget}
          selectedChildProfileId={selectedChildProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setAccountStatus={setAccountStatus}
          setChildEmail={setChildEmail}
          setChildName={setChildName}
          setChildPhone={setChildPhone}
          setConsent={setConsent}
          setContactOwner={setContactOwner}
          setDuplicateProfileAcknowledged={setDuplicateProfileAcknowledged}
          setGrade={setGrade}
          setLegacyAccountSelected={setLegacyAccountSelected}
          setLookupState={setLookupState}
          setLookupPickerOpen={setLookupPickerOpen}
          setParentPhone={setParentPhone}
          setParentUpdatePhone={setParentUpdatePhone}
          setPhone={setPhone}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          setWizardStep={setWizardStep}
          showNewAccountForm={showNewAccountForm}
          usesParentIdentity={usesParentIdentity}
          wizardStep={wizardStep}
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard className="purpose-card" title="Tujuan Pembelian Paket">
      <StagePanel step="TAHAP 1" title="Pilih Status Kepemilikan Akun">
        <ChoiceCard
          active={accountStatus === 'existing'}
          description="Orang tua/anak sudah pernah memiliki akun, ingin renew paket atau berlangganan sebelumnya"
          title="Sudah Punya Akun"
          onClick={() => setAccountStatus('existing')}
        />
        <ChoiceCard
          active={accountStatus === 'new'}
          description="Orang tua/anak belum pernah memiliki akun atau berlangganan sebelumnya"
          title="Belum Punya Akun"
          onClick={() => setAccountStatus('new')}
        />
      </StagePanel>

      <LookupStage
        accountStatus={accountStatus}
        checkNumber={checkNumber}
        legacyAccountSelected={legacyAccountSelected}
        lookupState={lookupState}
        lookupPickerOpen={lookupPickerOpen}
        parentUpdateName={parentUpdateName}
        parentUpdatePhone={parentUpdatePhone}
        profileTarget={profileTarget}
        selectedChildProfileId={selectedChildProfileId}
        selectedChildSearchProfileId={selectedChildSearchProfileId}
        phone={phone}
        setAccountStatus={setAccountStatus}
        contactOwner={contactOwner}
        isBeforeAfterMapping={false}
        isExplicitMapping={isExplicitMapping}
        setContactOwner={setContactOwner}
        setLegacyAccountSelected={setLegacyAccountSelected}
        setLookupState={setLookupState}
        setLookupPickerOpen={setLookupPickerOpen}
        setPhone={setPhone}
        setProfileTarget={setProfileTarget}
        setSelectedChildProfileId={setSelectedChildProfileId}
        setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
        setPackageIntent={setPackageIntent}
      />

      {selectedSearchParentAccount && selectedChildSearchProfile && (
        <StagePanel className="form-stage" step="TAHAP 3" title="Lengkapi Data Orang Tua">
          <SelectedChildAccountStage
            account={selectedSearchParentAccount}
            profile={selectedChildSearchProfile}
            parentUpdateName={parentUpdateName}
            parentUpdatePhone={parentUpdatePhone}
            setParentUpdatePhone={setParentUpdatePhone}
          />
        </StagePanel>
      )}

      {parentLookupAccount && parentLookupSelectionReady && (
        <StagePanel className="form-stage" step="TAHAP 3" title="Profil Tujuan Aktivasi Paket">
          <ProfileTargetStage
            account={parentLookupAccount}
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            parentUpdateName={parentUpdateName}
            parentUpdatePhone={parentUpdatePhone}
            profileTarget={profileTarget}
            selectedChildProfileId={selectedChildProfileId}
            duplicateProfileAcknowledged={duplicateProfileAcknowledged}
            duplicateProfileMatches={duplicateProfileMatches}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
            setDuplicateProfileAcknowledged={setDuplicateProfileAcknowledged}
            setPackageIntent={setPackageIntent}
            setParentUpdatePhone={setParentUpdatePhone}
            setProfileTarget={setProfileTarget}
            setSelectedChildProfileId={setSelectedChildProfileId}
          />
        </StagePanel>
      )}

      {showMigrationForm && (
        <>
          {isExplicitMapping && contactOwner && <MigrationStateSummary contactOwner={contactOwner} phone={phone} />}

          <StagePanel className="form-stage" step="TAHAP 3" title="Lengkapi Data Orang Tua dan Anak">
            <AccountForm
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              mode="migration"
              migrationIdentityToggle={!isExplicitMapping ? (
                <MigrationIdentityToggle
                  checked={usesParentIdentity}
                  onChange={() => setUsesParentIdentity(!usesParentIdentity)}
                />
              ) : undefined}
              parentPhone={usesParentIdentity ? parentPhone || phone : parentPhone}
              prefilledParentPhone={phone}
              usesParentIdentity={usesParentIdentity}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
              setParentPhone={setParentPhone}
            />
          </StagePanel>
        </>
      )}

      {showNewAccountForm && (
        <StagePanel className="form-stage" step="TAHAP 3" title="Buat Orang Tua dan Anak">
          <AccountForm
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            mode="new"
            parentPhone={parentPhone || phone}
            usesParentIdentity={false}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
            setParentPhone={setParentPhone}
          />
        </StagePanel>
      )}
    </SectionCard>
  )
}

function OptionThreeWizard({
  accountStatus,
  checkNumber,
  childEmail,
  childName,
  childPhone,
  consent,
  contactOwner,
  duplicateProfileAcknowledged,
  duplicateProfileMatches,
  grade,
  legacyAccountSelected,
  lookupState,
  lookupPickerOpen,
  parentName,
  parentPhone,
  parentUpdateName,
  parentUpdatePhone,
  phone,
  profileTarget,
  selectedChildProfileId,
  selectedChildSearchProfileId,
  setAccountStatus,
  setChildEmail,
  setChildName,
  setChildPhone,
  setConsent,
  setContactOwner,
  setDuplicateProfileAcknowledged,
  setGrade,
  setLegacyAccountSelected,
  setLookupState,
  setLookupPickerOpen,
  setParentPhone,
  setParentUpdatePhone,
  setPhone,
  setPackageIntent,
  setProfileTarget,
  setSelectedChildProfileId,
  setSelectedChildSearchProfileId,
  setWizardStep,
  showNewAccountForm,
  usesParentIdentity,
  wizardStep,
}: OptionThreeWizardProps) {
  const goBack = () => setWizardStep(Math.max(1, wizardStep - 1) as WizardStep)
  const isNewAccount = accountStatus === 'new' && showNewAccountForm
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const selectedSearchProfile = childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId) ?? null
  const parentAccountForUpdate = parentLookupAccount ?? (selectedSearchProfile ? getParentAccountFromChildProfile(selectedSearchProfile) : null)
  const parentUpdateState = parentAccountForUpdate ? getParentUpdateState(parentAccountForUpdate, parentUpdateName, parentUpdatePhone) : null
  const wizardParentName = parentAccountForUpdate ? parentUpdateState?.nextName ?? parentAccountForUpdate.name : parentName
  const wizardParentPhone = parentAccountForUpdate ? parentUpdateState?.nextPhone ?? parentAccountForUpdate.phone : parentLookupAccount?.phone ?? (usesParentIdentity ? phone : parentPhone)

  return (
    <>
      <MigrationStageStepper
        accountStatus={accountStatus}
        legacyAccountSelected={legacyAccountSelected}
        lookupState={lookupState}
        profileTarget={profileTarget}
        selectedChildProfileId={selectedChildProfileId}
        selectedChildSearchProfileId={selectedChildSearchProfileId}
        wizardStep={wizardStep}
      />
      {wizardStep > 1 && <WizardBackButton onClick={goBack} />}

      {wizardStep === 1 && (
        <WizardLookupStep
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          legacyAccountSelected={legacyAccountSelected}
          lookupState={lookupState}
          lookupPickerOpen={lookupPickerOpen}
          parentUpdateName={parentUpdateName}
          parentUpdatePhone={parentUpdatePhone}
          phone={phone}
          profileTarget={profileTarget}
          selectedChildProfileId={selectedChildProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setAccountStatus={setAccountStatus}
          setLegacyAccountSelected={setLegacyAccountSelected}
          setLookupState={setLookupState}
          setLookupPickerOpen={setLookupPickerOpen}
          setParentUpdatePhone={setParentUpdatePhone}
          setPhone={setPhone}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
        />
      )}

      {wizardStep === 2 && (
        <StagePanel step="STEP 2" title="Tentukan Tujuan Paket">
          {parentLookupAccount ? (
            <ProfileTargetStage
              account={parentLookupAccount}
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              parentUpdateName={parentUpdateName}
              parentUpdatePhone={parentUpdatePhone}
              duplicateProfileAcknowledged={duplicateProfileAcknowledged}
              duplicateProfileMatches={duplicateProfileMatches}
              profileTarget={profileTarget}
              selectedChildProfileId={selectedChildProfileId}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
              setDuplicateProfileAcknowledged={setDuplicateProfileAcknowledged}
              setPackageIntent={setPackageIntent}
              setParentUpdatePhone={setParentUpdatePhone}
              setProfileTarget={setProfileTarget}
              setSelectedChildProfileId={setSelectedChildProfileId}
            />
          ) : (
            <BeforeAfterMappingPanel contactOwner={contactOwner} phone={phone} setContactOwner={setContactOwner} />
          )}
        </StagePanel>
      )}

      {wizardStep === 3 && (
        <StagePanel className="form-stage" step="STEP 3" title={isNewAccount ? 'Buat Orang Tua' : 'Lengkapi Data Orang Tua'}>
          <ParentDataStep
            mode={isNewAccount ? 'new' : 'migration'}
            parentPhone={usesParentIdentity ? parentPhone || phone : parentPhone}
            setParentPhone={setParentPhone}
            usesParentIdentity={usesParentIdentity}
          />
        </StagePanel>
      )}

      {wizardStep === 4 && (
        <StagePanel className="form-stage" step="STEP 4" title={parentLookupAccount ? 'Buat Anak Baru' : 'Lengkapi Anak'}>
          {parentLookupAccount ? (
            <>
              <NewChildProfileForm
                childEmail={childEmail}
                childName={childName}
                childPhone={childPhone}
                grade={grade}
                setChildEmail={setChildEmail}
                setChildName={setChildName}
                setChildPhone={setChildPhone}
                setGrade={setGrade}
              />
              <DuplicateProfileWarning
                acknowledged={duplicateProfileAcknowledged}
                matches={duplicateProfileMatches}
                onAcknowledge={() => setDuplicateProfileAcknowledged(true)}
                onUseProfile={(profile) => {
                  setProfileTarget('existing')
                  setSelectedChildProfileId(profile.id)
                  setPackageIntent(null)
                  setDuplicateProfileAcknowledged(false)
                  setWizardStep(2)
                }}
              />
            </>
          ) : (
            <ChildProfileStep
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
            />
          )}
        </StagePanel>
      )}

      {wizardStep === 5 && (
        <StagePanel step="STEP 5" title="Review Tujuan Paket dan Persetujuan">
          <WizardReviewStep
            accountStatus={accountStatus}
            childName={childName}
            consent={consent}
            grade={grade}
            parentAccount={parentLookupAccount}
            parentName={wizardParentName}
            parentPhone={wizardParentPhone}
            phone={phone}
            profileTarget={profileTarget}
            selectedChildProfileId={selectedChildProfileId}
            selectedChildSearchProfileId={selectedChildSearchProfileId}
            setConsent={setConsent}
            usesParentIdentity={usesParentIdentity}
          />
        </StagePanel>
      )}
    </>
  )
}

type PurchasePurposeCardProps = {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  childEmail: string
  childName: string
  childPhone: string
  consent: boolean
  duplicateProfileAcknowledged: boolean
  duplicateProfileMatches: ChildProfile[]
  grade: string
  legacyAccountSelected: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  parentName: string
  parentPhone: string
  parentUpdateName: string
  parentUpdatePhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setConsent: (value: boolean) => void
  setDuplicateProfileAcknowledged: (value: boolean) => void
  setGrade: (value: string) => void
  setLegacyAccountSelected: (value: boolean) => void
  setParentPhone: (value: string) => void
  setParentUpdatePhone: (value: string) => void
  setPhone: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
  setUsesParentIdentity: (value: boolean) => void
  setLookupState: (value: LookupState) => void
  setLookupPickerOpen: (value: boolean) => void
  setContactOwner: (value: ContactOwner) => void
  setWizardStep: (value: WizardStep) => void
  showMigrationForm: boolean
  showNewAccountForm: boolean
  usesParentIdentity: boolean
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  wizardStep: WizardStep
}

type OptionThreeWizardProps = Omit<PurchasePurposeCardProps, 'isBeforeAfterMapping' | 'isExplicitMapping' | 'setUsesParentIdentity' | 'showMigrationForm'>

type StepperState = 'active' | 'done' | 'pending'

type WizardStepperContext = {
  accountStatus: AccountStatus | null
  legacyAccountSelected: boolean
  lookupState: LookupState
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  wizardStep: WizardStep
}

function getDynamicWizardSteps({ accountStatus, legacyAccountSelected, lookupState, profileTarget, selectedChildProfileId, selectedChildSearchProfileId }: WizardStepperContext): Array<{ id: WizardStep; label: string }> {
  const hasLookupResult = lookupState !== 'idle'
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const hasSearchProfile = (isSearchResolutionLookup(lookupState) || lookupState === 'existing-old-account-with-child-profile-contact') && Boolean(selectedChildSearchProfileId)

  if (!accountStatus || !hasLookupResult) {
    return [{ id: 1, label: 'Cari' }]
  }

  if (hasSearchProfile) {
    return [
      { id: 1, label: 'Cari' },
      { id: 5, label: 'Review' },
    ]
  }

  if (parentLookupAccount) {
    if (profileTarget === 'existing' && selectedChildProfileId) {
      return [
        { id: 1, label: 'Cari' },
        { id: 2, label: 'Tujuan' },
        { id: 5, label: 'Review' },
      ]
    }

    if (profileTarget === 'new') {
      return [
        { id: 1, label: 'Cari' },
        { id: 2, label: 'Tujuan' },
        { id: 4, label: 'Anak' },
        { id: 5, label: 'Review' },
      ]
    }

    return [
      { id: 1, label: 'Cari' },
      { id: 2, label: 'Tujuan' },
    ]
  }

  if (accountStatus === 'new' && lookupState === 'new-available') {
    return [
      { id: 1, label: 'Cari' },
      { id: 3, label: 'Ortu' },
      { id: 4, label: 'Anak' },
      { id: 5, label: 'Review' },
    ]
  }

  if (lookupState === 'existing-old-account-with-child-profile-contact' && !legacyAccountSelected) {
    return [{ id: 1, label: 'Cari' }]
  }

  if (isOldAccountLookup(lookupState)) {
    return [
      { id: 1, label: 'Cari' },
      { id: 2, label: 'Tujuan' },
      { id: 3, label: 'Ortu' },
      { id: 4, label: 'Anak' },
      { id: 5, label: 'Review' },
    ]
  }

  return [{ id: 1, label: 'Cari' }]
}

function MigrationStageStepper(props: WizardStepperContext) {
  const steps = getDynamicWizardSteps(props)
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === props.wizardStep))

  return (
    <nav
      className={steps.length === 1 ? 'stage-stepper compact' : 'stage-stepper'}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      aria-label="Tahap migrasi akun"
    >
      {steps.map((step, index) => {
        const state: StepperState = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending'

        return (
          <div className={`stage-step ${state}`} key={step.id}>
            <span>{state === 'done' ? <Check size={12} /> : index + 1}</span>
            <strong>{step.label}</strong>
          </div>
        )
      })}
    </nav>
  )
}
function WizardBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="wizard-back" type="button" onClick={onClick}>
      <ArrowLeft size={14} />
      Kembali
    </button>
  )
}

function WizardLookupStep({ accountStatus, checkNumber, legacyAccountSelected, lookupState, lookupPickerOpen, parentUpdateName, parentUpdatePhone, phone, profileTarget, selectedChildProfileId, selectedChildSearchProfileId, setAccountStatus, setLegacyAccountSelected, setLookupState, setLookupPickerOpen, setPhone, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId }: {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  legacyAccountSelected: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  parentUpdateName: string
  parentUpdatePhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setLegacyAccountSelected: (value: boolean) => void
  setLookupState: (value: LookupState) => void
  setLookupPickerOpen: (value: boolean) => void
  setParentUpdatePhone: (value: string) => void
  setPhone: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
}) {
  const isExistingFlow = accountStatus === 'existing'
  const selectedLookupProfile = (isSearchResolutionLookup(lookupState) || lookupState === 'existing-old-account-with-child-profile-contact')
    ? childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId)
    : undefined
  const selectedLookupParentAccount = selectedLookupProfile ? getParentAccountFromChildProfile(selectedLookupProfile) : null
  const selectedLookupParentUpdateState = selectedLookupParentAccount ? getParentUpdateState(selectedLookupParentAccount, parentUpdateName, parentUpdatePhone) : null
  return (
    <StagePanel step="STEP 1" title="Cari Customer dan Status Akun">
      <ChoiceCard
        active={accountStatus === 'existing'}
        description="Cek akun customer untuk menentukan tujuan paket dan kebutuhan konversi."
        title="Sudah Punya Akun"
        onClick={() => setAccountStatus('existing')}
      />
      <ChoiceCard
        active={accountStatus === 'new'}
        description="Customer belum punya akun Ruangguru. Lewati mapping dan buat struktur baru."
        title="Belum Punya Akun"
        onClick={() => setAccountStatus('new')}
      />

      {accountStatus && (
        <div className="wizard-lookup-area">
          <div className="lookup-row">
            <input
              value={phone}
              placeholder="No. HP / User serial"
              onChange={(event) => setPhone(event.target.value)}
              aria-label={isExistingFlow ? 'No. HP atau User Serial customer' : 'Nomor HP orang tua'}
            />
            <button type="button" onClick={checkNumber}>Cek Akun</button>
          </div>

          {lookupState === 'idle' && (
            <Callout className="lookup-hint">
              <strong>Arahan untuk Agent</strong>
              <p>{isExistingFlow ? 'Input No. HP atau User Serial yang diberikan customer.' : 'Input No. HP orang tua yang akan menjadi Master Account.'}</p>
            </Callout>
          )}
          {lookupState === 'existing-old-account-with-child-profile-contact' ? (
            <OldAccountPickerTrigger
              legacyAccountSelected={legacyAccountSelected}
              matchedValue={phone}
              profiles={getOldAccountProfileContactMatches(lookupState)}
              selectedChildSearchProfileId={selectedChildSearchProfileId}
              onOpen={() => setLookupPickerOpen(true)}
            />
          ) : lookupState === 'existing-old-account' && (
            <OldAccountPickerTrigger
              legacyAccountSelected={legacyAccountSelected}
              matchedValue={phone}
              profiles={[]}
              selectedChildSearchProfileId=""
              onOpen={() => setLookupPickerOpen(true)}
            />
          )}

          {isSearchResolutionLookup(lookupState) && (
            <>
              {!selectedLookupProfile && (
                <LookupPickerTrigger
                  lookupState={lookupState}
                  matchedValue={phone}
                  selectedChildSearchProfileId={selectedChildSearchProfileId}
                  onOpen={() => setLookupPickerOpen(true)}
                />
              )}
              {selectedLookupProfile && (
                <div className="lookup-main-review compact-selected-target">
                  <SelectedTargetSummary
                    actionLabel="Ubah"
                    onAction={() => setLookupPickerOpen(true)}
                    matchedValue={phone}
                    parentName={selectedLookupParentUpdateState?.nextName ?? selectedLookupProfile.parentName ?? 'Orang Tua'}
                    parentPhone={selectedLookupParentUpdateState?.nextPhone ?? selectedLookupProfile.parentPhone ?? '-'}
                    parentSerial={selectedLookupProfile.parentSerial}
                    profile={selectedLookupProfile}
                  />
                </div>
              )}
            </>
          )}
          {isLookupNoticeState(lookupState) && <LookupNoticeTrigger lookupState={lookupState} phone={phone} onOpen={() => setLookupPickerOpen(true)} />}
        </div>
      )}
      {lookupState === 'existing-old-account' && lookupPickerOpen && (
        <OldAccountPickerSheet
          legacyAccountSelected={legacyAccountSelected}
          matchedValue={phone}
          profiles={[]}
          selectedChildSearchProfileId=""
          setLegacyAccountSelected={setLegacyAccountSelected}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
      {lookupState === 'existing-old-account-with-child-profile-contact' && lookupPickerOpen && (
        <OldAccountPickerSheet
          legacyAccountSelected={legacyAccountSelected}
          matchedValue={phone}
          profiles={getOldAccountProfileContactMatches(lookupState)}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setLegacyAccountSelected={setLegacyAccountSelected}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
      {isLookupNoticeState(lookupState) && lookupPickerOpen && (
        <LookupNoticeSheet
          lookupState={lookupState}
          phone={phone}
          setAccountStatus={setAccountStatus}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
      {(isSearchResolutionLookup(lookupState) || isParentProfileLookup(lookupState)) && lookupPickerOpen && (
        <LookupPickerSheet
          lookupState={lookupState}
          matchedValue={phone}
          profileTarget={profileTarget}
          selectedChildProfileId={selectedChildProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setLookupState={setLookupState}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
    </StagePanel>
  )
}

function ActiveDataNote({ compact = false }: { compact?: boolean }) {
  return <p className={compact ? 'active-data-note compact' : 'active-data-note'}>Pastikan data yang diisi merupakan data aktif dari Orang Tua dan Anak.</p>
}

function ParentDataStep({ mode, parentPhone, setParentPhone, usesParentIdentity }: {
  mode: 'migration' | 'new'
  migrationIdentityToggle?: ReactNode
  parentPhone: string
  setParentPhone: (value: string) => void
  usesParentIdentity: boolean
}) {
  const shouldCheckParentPhone = mode === 'migration' && !usesParentIdentity
  const parentPhoneAccount = shouldCheckParentPhone ? getRegisteredParentAccount(parentPhone) : null
  const parentPhoneIsCheckable = shouldCheckParentPhone && canCheckParentPhone(parentPhone)
  return (
    <div className="form-fields compact-form">
      <ActiveDataNote />
      <TextField
        helper={usesParentIdentity ? 'Terisi otomatis dari akun lama. Ubah hanya jika customer memberi nomor Orang Tua yang benar dan aktif.' : 'Pastikan nomor ini adalah nomor yang benar dan aktif.'}
        label="No. HP Orang Tua"
        placeholder="Masukan no. HP orang tua"
        value={parentPhone}
        onChange={setParentPhone}
      />
      {shouldCheckParentPhone && parentPhoneIsCheckable && (
        <ParentPhoneCheckResult account={parentPhoneAccount} phone={parentPhone} />
      )}
    </div>
  )
}

function ChildProfileStep({ childEmail, childName, childPhone, grade, setChildEmail, setChildName, setChildPhone, setGrade }: {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
}) {
  return (
    <div className="form-fields compact-form">
      <ActiveDataNote />
      <TextField label="Nama Lengkap Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak, bukan akses login utama. Nomor boleh sama dengan milik orang tua."
        label="No. HP Anak"
        placeholder="Masukan no. HP anak"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak, bukan akses login utama. Email boleh sama dengan milik orang tua."
        label="Email Anak"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
    </div>
  )
}

function NewChildProfileForm({ childEmail, childName, childPhone, grade, setChildEmail, setChildName, setChildPhone, setGrade }: {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
}) {
  return (
    <div className="form-fields compact-form">
      <TextField label="Nama Lengkap Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak. Nomor boleh sama dengan milik orang tua."
        label="No. HP Anak"
        placeholder="Masukan no. HP anak"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak dan tidak bisa digunakan login."
        label="Email Anak"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout>
        <strong>Setelah transaksi berhasil</strong>
        <PointList items={[
          'Anak baru dibuat di bawah Orang Tua yang ditemukan.',
          'Username dan PIN anak dikirim ke WhatsApp Orang Tua.',
        ]} />
      </Callout>
    </div>
  )
}

function WizardReviewStep({ accountStatus, childName, consent, grade, parentAccount, parentName, parentPhone, phone, profileTarget, selectedChildProfileId, selectedChildSearchProfileId, setConsent, usesParentIdentity }: {
  accountStatus: AccountStatus | null
  childName: string
  consent: boolean
  grade: string
  parentAccount: ParentProfileAccount | null
  parentName: string
  parentPhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  setConsent: (value: boolean) => void
  usesParentIdentity: boolean
}) {
  const isNewAccount = accountStatus === 'new'
  const selectedProfile = parentAccount?.profiles.find((profile) => profile.id === selectedChildProfileId)
  const selectedSearchProfile = childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId)
  const parentLabel = usesParentIdentity ? parentName || 'Orang tua dari data akun lama' : parentName || 'Orang tua'
  const parentNumberLabel = usesParentIdentity ? phone : parentPhone || phone || 'yang diisi agent'
  const parentDisplayName = parentName || selectedSearchProfile?.parentName || parentAccount?.name || parentLabel
  const parentDisplayPhone = parentPhone || selectedSearchProfile?.parentPhone || parentAccount?.phone || parentNumberLabel
  const targetProfileName = selectedSearchProfile
    ? selectedSearchProfile.name
    : parentAccount
    ? profileTarget === 'existing' && selectedProfile
      ? selectedProfile.name
      : childName || 'Anak baru'
    : isNewAccount || usesParentIdentity
      ? childName || 'Anak baru'
      : existingAccount.name
  const targetGrade = selectedSearchProfile?.grade ?? (parentAccount && profileTarget === 'existing' && selectedProfile ? selectedProfile.grade : grade || '-')
  const usesExistingProfile = Boolean(selectedSearchProfile || (parentAccount && profileTarget === 'existing' && selectedProfile))
  const reviewType = selectedSearchProfile || parentAccount ? 'Aktivasi paket' : isNewAccount ? 'Pembuatan akun' : 'Konversi akun'
  const accessCopy = parentAccount || isNewAccount ? 'Username dan PIN dikirim ke WhatsApp Orang Tua.' : 'Login anak berubah ke Username dan PIN.'
  const parentPhoneWillChange = Boolean(selectedSearchProfile && parentPhone && normalizePhoneDigits(parentPhone) !== normalizePhoneDigits(selectedSearchProfile.parentPhone ?? ''))
  const changeOverviewItems = [
    parentPhoneWillChange ? `No. HP Orang Tua diubah dari ${selectedSearchProfile?.parentPhone} ke ${parentPhone}.` : null,
    !usesExistingProfile ? accessCopy : null,
  ].filter(Boolean) as string[]
  const consentCopy = 'Saya sudah memastikan data Orang Tua, data Anak, dan profil tujuan paket sudah benar, aktif, dan sesuai dengan informasi customer.'
  const reviewProfile: ChildProfile = {
    contact: selectedSearchProfile?.contact ?? selectedProfile?.contact ?? undefined,
    grade: targetGrade,
    hasActivePackage: selectedSearchProfile?.hasActivePackage ?? selectedProfile?.hasActivePackage,
    id: selectedSearchProfile?.id ?? selectedProfile?.id ?? 'wizard-review-child-target',
    name: targetProfileName,
    packageName: selectedSearchProfile?.packageName ?? selectedProfile?.packageName,
    packageNames: selectedSearchProfile?.packageNames ?? selectedProfile?.packageNames,
    parentName: parentDisplayName,
    parentPhone: parentDisplayPhone,
    parentSerial: selectedSearchProfile?.parentSerial ?? parentAccount?.serial,
    serial: selectedSearchProfile?.serial ?? selectedProfile?.serial ?? '',
  }

  return (
    <div className="wizard-review scan-review">
      <ReviewTargetCard
        parentName={parentDisplayName}
        parentPhone={parentDisplayPhone}
        parentSerial={selectedSearchProfile?.parentSerial ?? parentAccount?.serial}
        profile={reviewProfile}
        typeLabel={reviewType}
      />

      {changeOverviewItems.length > 0 && (
        <ReviewChangeOverview items={changeOverviewItems} />
      )}

      <section className="review-checklist" aria-label="Yang perlu dipastikan">
        <h4>Pernyataan agent</h4>
        <ReviewCheckItem>Data Orang Tua dan Anak sudah benar dan aktif.</ReviewCheckItem>
        <ReviewCheckItem>Profil tujuan paket sudah sesuai dengan customer.</ReviewCheckItem>
        {!usesExistingProfile && <ReviewCheckItem>No. HP/email anak hanya tersimpan sebagai data profil.</ReviewCheckItem>}
      </section>

      <label className="consent-row review-consent">
        <input checked={consent} type="checkbox" onChange={(event) => setConsent(event.target.checked)} />
        <span>{consentCopy}</span>
      </label>
    </div>
  )
}

function ReviewTargetCard({ parentName, parentPhone, parentSerial, profile, typeLabel }: { parentName: string; parentPhone: string; parentSerial?: string; profile: ChildProfile; typeLabel: string }) {
  return (
    <section className="search-target-card selected review-target-card" aria-label="Ringkasan tujuan paket">
      <div className="search-target-head">
        <div>
          <span className="summary-kicker">{typeLabel}</span>
          <strong>Profil tujuan paket</strong>
          <div className="review-package-line">
            <span>Paket dibeli</span>
            <strong>ruangbelajar SMA/SMK 1 Tahun</strong>
          </div>
        </div>
      </div>
      <AccountRelationCard
        mode="child-first"
        parentName={parentName}
        parentPhone={parentPhone}
        parentSerial={parentSerial}
        profile={profile}
      />
    </section>
  )
}
function ReviewChangeOverview({ items }: { items: string[] }) {
  return (
    <section className="review-change-overview" aria-label="Overview perubahan">
      <span>Overview perubahan</span>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}

function ReviewCheckItem({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <div className={warning ? 'review-check warning' : 'review-check'}>
      {warning ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      <span>{children}</span>
    </div>
  )
}

function ChoiceCard({ active = false, description, onClick, title }: { active?: boolean; description: string; onClick: () => void; title: string }) {
  return (
    <button className={active ? 'choice-card active' : 'choice-card'} type="button" onClick={onClick}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span className="radio-dot" />
    </button>
  )
}

function getDirectParentResultCount(lookupState: LookupState) {
  if (lookupState === 'existing-multiple-matches') return 1
  if (isParentProfileLookup(lookupState)) return 1
  return 0
}

function formatResultSummaryPart(count: number, label: string) {
  if (count <= 0) return null
  return `${count} ${label}`
}

function ResultSummaryText({ childCount = 0, matchedValue, oldAccountCount = 0, parentCount = 0 }: { childCount?: number; matchedValue: string; oldAccountCount?: number; parentCount?: number }) {
  const parts = [
    formatResultSummaryPart(parentCount, 'Orang Tua'),
    formatResultSummaryPart(childCount, 'Anak'),
    formatResultSummaryPart(oldAccountCount, 'akun lama'),
  ].filter(Boolean)

  if (parts.length === 0) return null

  return <p className="result-summary-text">{parts.join(', ')} ditemukan dengan {isSerialLookupInput(matchedValue) ? 'user serial' : 'nomor'} <strong>{matchedValue}</strong></p>
}

function LookupPickerTrigger({ lookupState, matchedValue, onOpen, selectedChildSearchProfileId }: { lookupState: LookupState; matchedValue: string; onOpen: () => void; selectedChildSearchProfileId: string }) {
  const profileResults = getChildProfileSearchResults(lookupState)
  const selectedProfile = profileResults.find((profile) => profile.id === selectedChildSearchProfileId)

  return (
    <SearchTargetCard
      actionLabel={selectedProfile ? 'Ubah' : 'Lihat'}
      matchedValue={matchedValue}
      profile={selectedProfile}
      onAction={onOpen}
    />
  )
}

function LookupPickerSheet({ lookupState, matchedValue, profileTarget, selectedChildProfileId, selectedChildSearchProfileId, setLookupState, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId, onClose }: {
  lookupState: LookupState
  matchedValue: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  setLookupState: (value: LookupState) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
  onClose: () => void
}) {
  const profileResults = getChildProfileSearchResults(lookupState)
  const hasSelection = isParentProfileLookup(lookupState)
    ? Boolean(selectedChildProfileId || profileTarget === 'new')
    : Boolean(selectedChildSearchProfileId)

  return (
    <BottomSheet className="lookup-picker-sheet" title="Pilih Tujuan Paket" onClose={onClose}>
      <ResultSummaryText childCount={profileResults.length} matchedValue={matchedValue} parentCount={getDirectParentResultCount(lookupState)} />
      <SearchResolutionResults
        lookupState={lookupState}
        matchedValue={matchedValue}
        profileTarget={profileTarget}
        selectedChildProfileId={selectedChildProfileId}
        selectedChildSearchProfileId={selectedChildSearchProfileId}
        setLookupState={setLookupState}
        setPackageIntent={setPackageIntent}
        setProfileTarget={setProfileTarget}
        setSelectedChildProfileId={setSelectedChildProfileId}
        setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
      />
      <button className="sheet-primary" disabled={!hasSelection} type="button" onClick={onClose}>Pilih Tujuan</button>
    </BottomSheet>
  )
}


function SearchResolutionResults({ lookupState, matchedValue, profileTarget, selectedChildProfileId, selectedChildSearchProfileId, setLookupState, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId }: {
  lookupState: LookupState
  matchedValue: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  setLookupState: (value: LookupState) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
}) {
  const profileResults = getChildProfileSearchResults(lookupState)
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const directParentAccount = parentLookupAccount ?? (lookupState === 'existing-multiple-matches'
    ? { ...parentAccountWithChildren, phone: normalizePhoneDigits(matchedValue).length >= 8 ? matchedValue : parentAccountWithChildren.phone }
    : null)
  const shouldShowParentBucket = false
  const showSeparateParentResult = Boolean(directParentAccount)
  const activeChildId = parentLookupAccount ? selectedChildProfileId : selectedChildSearchProfileId
  const parentGroups = profileResults.reduce<Array<{ name: string; phone: string; serial?: string; profiles: ChildProfile[] }>>((groups, profile) => {
    const parentPhoneKey = profile.parentPhone ?? 'unknown'
    const existingGroup = groups.find((group) => group.phone === parentPhoneKey)

    if (existingGroup) {
      existingGroup.profiles.push(profile)
      return groups
    }

    return [...groups, { name: profile.parentName ?? 'Orang Tua', phone: parentPhoneKey, serial: profile.parentSerial, profiles: [profile] }]
  }, [])

  const selectParentAccount = () => {
    if (parentLookupAccount) {
      setProfileTarget('new')
      setSelectedChildProfileId('')
      setSelectedChildSearchProfileId('')
      setPackageIntent(null)
      return
    }

    setLookupState('existing-parent-with-children')
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setPackageIntent(null)
  }

  const selectChildProfile = (profile: ChildProfile) => {
    setProfileTarget('existing')
    setPackageIntent(null)

    if (parentLookupAccount) {
      setSelectedChildProfileId(profile.id)
      setSelectedChildSearchProfileId('')
      return
    }

    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId(profile.id)
  }

  return (
    <div className="search-resolution">
      {showSeparateParentResult && (
        <div className="resolution-group">
          <span className="resolution-label">Akun Orang Tua</span>
          <ParentAccountCard account={directParentAccount!} active={Boolean(parentLookupAccount && profileTarget === 'new')} matchedValue={matchedValue} onClick={selectParentAccount} showProfiles={false} />
        </div>
      )}

      {profileResults.length > 0 && (
        <div className="resolution-group result-list-shell">
          <span className="resolution-label">Profil Anak</span>
          <div className={shouldShowParentBucket ? 'resolution-profile-groups grouped' : 'resolution-profile-groups'}>
            {parentGroups.map((group) => (
              <div className={shouldShowParentBucket ? 'resolution-parent-bucket grouped' : 'resolution-parent-bucket'} key={group.phone}>
                {shouldShowParentBucket && <ParentBucketHeading name={group.name} phone={group.phone} serial={group.serial} />}
                {group.profiles.map((profile) => (
                  <ChildTargetCandidateCard
                    active={activeChildId === profile.id}
                    key={profile.id}
                    profile={profile}
                    onClick={() => selectChildProfile(profile)}
                    hideParentDetail={false}
                    matchedValue={matchedValue}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
function SelectedChildAccountStage({ account, parentUpdateName, parentUpdatePhone, profile, setParentUpdatePhone }: {
  account: ParentProfileAccount
  parentUpdateName: string
  parentUpdatePhone: string
  profile: ChildProfile
  setParentUpdatePhone: (value: string) => void
}) {
  const parentUpdateState = getParentUpdateState(account, parentUpdateName, parentUpdatePhone)

  return (
    <div className="profile-target-stage">
      <ParentUpdatePanel
        parentPhone={parentUpdatePhone || account.phone}
        updateState={parentUpdateState}
        setParentPhone={setParentUpdatePhone}
      />
      <ReadonlyChildDetailPanel profile={profile} />
    </div>
  )
}

function ReadonlyChildDetailPanel({ profile }: { profile: ChildProfile }) {
  return (
    <div className="readonly-child-panel">
      <div className="parent-update-head">
        <div>
          <strong>Data Anak</strong>
        </div>
      </div>
      <div className="form-fields compact-form readonly-child-fields">
        <ReadonlyTextInput label="Nama Anak" value={profile.name} />
        <ReadonlyTextInput label="Kelas" value={profile.grade} />
        <ReadonlyTextInput label="No. HP Anak" value={profile.contact ?? '-'} />
        <ReadonlyTextInput label="User Serial Anak" value={profile.serial} />
        {profile.lastLoginAt && <ReadonlyTextInput label="Login Terakhir" value={profile.lastLoginAt} />}
      </div>
    </div>
  )
}
function ProfileTargetStage({ account, childEmail, childName, childPhone, duplicateProfileAcknowledged, duplicateProfileMatches, grade, parentUpdateName, parentUpdatePhone, profileTarget, selectedChildProfileId, setChildEmail, setChildName, setChildPhone, setDuplicateProfileAcknowledged, setGrade, setPackageIntent, setParentUpdatePhone, setProfileTarget, setSelectedChildProfileId }: {
  account: ParentProfileAccount
  childEmail: string
  childName: string
  childPhone: string
  duplicateProfileAcknowledged: boolean
  duplicateProfileMatches: ChildProfile[]
  grade: string
  parentUpdateName: string
  parentUpdatePhone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setDuplicateProfileAcknowledged: (value: boolean) => void
  setGrade: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setParentUpdatePhone: (value: string) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
}) {
  const selectedProfile = account.profiles.find((profile) => profile.id === selectedChildProfileId)
  const hasProfiles = account.profiles.length > 0
  const parentUpdateState = getParentUpdateState(account, parentUpdateName, parentUpdatePhone)
  const selectExistingProfile = (profile: ChildProfile) => {
    setProfileTarget('existing')
    setSelectedChildProfileId(profile.id)
    setPackageIntent(null)
    setDuplicateProfileAcknowledged(false)
  }

  const selectNewProfile = () => {
    setProfileTarget('new')
    setSelectedChildProfileId('')
    setPackageIntent(null)
    setDuplicateProfileAcknowledged(false)
  }

  return (
    <div className="profile-target-stage">
      <div className="resolution-group result-list-shell parent-profile-selection">
        <span className="resolution-label">{hasProfiles ? 'Tujuan Paket' : 'Tujuan Paket'}</span>
        <div className="resolution-profile-groups grouped">
          <div className="resolution-parent-bucket grouped">
            <ParentBucketHeading name={account.name} phone={account.phone} serial={account.serial} />
            {account.profiles.map((profile) => (
              <ChildTargetCandidateCard
                active={profileTarget === 'existing' && selectedChildProfileId === profile.id}
                key={profile.id}
                profile={profile}
                onClick={() => selectExistingProfile(profile)}
                hideParentDetail
              />
            ))}
            <NewChildTargetCard active={profileTarget === 'new'} hasProfiles={hasProfiles} onClick={selectNewProfile} />
          </div>
        </div>
      </div>

      {selectedProfile?.hasActivePackage && (
        <Callout variant="warning">
          <strong>Anak ini sudah punya paket aktif</strong>
          <PointList items={[
            'Pastikan paket baru memang akan diaktifkan untuk Anak ini.',
            'Jika bukan untuk Anak ini, pilih Anak lain atau buat Profil Baru.',
          ]} />
        </Callout>
      )}

      <ParentUpdatePanel
        parentPhone={parentUpdatePhone || account.phone}
        updateState={parentUpdateState}
        setParentPhone={setParentUpdatePhone}
      />

      {profileTarget === 'new' && (
        <div className="new-profile-inline">
          <h4>Data Anak Baru</h4>
          <NewChildProfileForm
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
          />
          <DuplicateProfileWarning
            acknowledged={duplicateProfileAcknowledged}
            matches={duplicateProfileMatches}
            onAcknowledge={() => setDuplicateProfileAcknowledged(true)}
            onUseProfile={selectExistingProfile}
          />
        </div>
      )}
    </div>
  )
}

function HighlightedMatch({ match, value }: { match?: string; value?: string }) {
  if (!value) return null

  const normalizedDigitMatch = normalizePhoneDigits(match ?? '')
  const normalizedDigitValue = normalizePhoneDigits(value)
  const normalizedTextMatch = normalizeLookupText(match ?? '')
  const normalizedTextValue = normalizeLookupText(value)
  const isDigitMatch = Boolean(normalizedDigitMatch && normalizedDigitValue && normalizedDigitValue.includes(normalizedDigitMatch.slice(-6)))
  const isTextMatch = Boolean(normalizedTextMatch && normalizedTextValue && normalizedTextValue.includes(normalizedTextMatch))
  const isMatch = isDigitMatch || isTextMatch

  return <span className={isMatch ? 'data-chip matched' : 'data-chip'}>{value}</span>
}

function ParentIdentityBlock({ matchedValue, name, phone, serial }: { matchedValue?: string; name: string; phone: string; serial?: string }) {
  return (
    <div className="relation-identity parent">
      <div className="relation-title-row">
        <span className="identity-badge parent">Orang Tua</span>
        <strong>{name}</strong>
      </div>
      <div className="relation-meta-row">
        <HighlightedMatch match={matchedValue} value={phone} />
        <UserSerial match={matchedValue} value={serial} />
      </div>
    </div>
  )
}

function LeadStatusBadge({ status = 'no-lead' }: { status?: LeadAssignmentStatus }) {
  const copy: Record<LeadAssignmentStatus, { label: string; text: string }> = {
    'assigned-to-me': { label: 'Lead kamu', text: 'Lead sudah ditugaskan ke kamu' },
    'no-lead': { label: 'Belum jadi lead', text: 'Belum ditugaskan ke agent' },
  }
  const item = copy[status]

  return <span className={`lead-status-badge ${status}`} title={item.text}>{item.label}</span>
}

function ChildIdentityBlock({ matchedValue, profile }: { matchedValue?: string; profile: ChildProfile }) {
  return (
    <div className="relation-identity child">
      <div className="relation-title-row">
        <span className="identity-badge child">Anak</span>
        <strong>{profile.name}</strong>
        <span className="inline-grade">{profile.grade}</span>
      </div>
      <div className="relation-meta-row">
        {profile.contact && <HighlightedMatch match={matchedValue} value={profile.contact} />}
        <UserSerial match={matchedValue} value={profile.serial} />
      </div>
      <div className="relation-status-row">
        <LeadStatusBadge status={profile.leadStatus} />
        <LastLoginLine value={profile.lastLoginAt} />
      </div>
      <ActivePackageLines profile={profile} />
    </div>
  )
}

function AccountRelationCard({ active = false, matchedValue, mode, onClick, parentName, parentPhone, parentSerial, profile, profiles = [], showNestedParent = true }: {
  active?: boolean
  matchedValue?: string
  mode: 'parent-first' | 'child-first' | 'selected'
  onClick?: () => void
  parentName: string
  parentPhone: string
  parentSerial?: string
  profile?: ChildProfile
  profiles?: ChildProfile[]
  showNestedParent?: boolean
}) {
  const className = ['account-relation-card', mode, active ? 'active' : '', onClick ? 'interactive' : ''].filter(Boolean).join(' ')
  const body = (
    <>
      {(mode === 'parent-first' || mode === 'selected') && (
        <ParentIdentityBlock matchedValue={matchedValue} name={parentName} phone={parentPhone} serial={parentSerial} />
      )}
      {mode === 'parent-first' && profiles.length > 0 && (
        <div className="relation-nested-list">
          {profiles.map((child) => <ChildIdentityBlock key={child.id} profile={child} matchedValue={matchedValue} />)}
        </div>
      )}
      {profile && (mode === 'child-first' || mode === 'selected') && (
        <ChildIdentityBlock profile={profile} matchedValue={matchedValue} />
      )}
      {mode === 'child-first' && showNestedParent && (
        <div className="relation-nested-parent">
          <ParentIdentityBlock matchedValue={matchedValue} name={parentName} phone={parentPhone} serial={parentSerial} />
        </div>
      )}
      {onClick && <span className="profile-radio" aria-hidden="true" />}
    </>
  )

  if (onClick) {
    return <button className={className} type="button" aria-pressed={active} onClick={onClick}>{body}</button>
  }

  return <div className={className}>{body}</div>
}

function ParentUpdatePanel({ parentPhone, setParentPhone, updateState }: {
  open?: boolean
  onOpen?: () => void
  parentPhone: string
  setOpen?: (value: boolean) => void
  setParentPhone: (value: string) => void
  updateState: ReturnType<typeof getParentUpdateState>
}) {
  const hasValidPhoneLength = canCheckParentPhone(parentPhone)

  return (
    <div className="parent-update-panel always-open">
      <div className="parent-update-head">
        <div>
          <strong>Data Orang Tua</strong>
          <small>Pastikan no. HP aktif untuk menerima kredensial Anak.</small>
        </div>
      </div>
      <div className="form-fields compact-form">
        <TextField
          helper="Ubah hanya jika customer memberi nomor Orang Tua yang benar dan aktif."
          label="No. HP Orang Tua"
          placeholder="Masukan no. HP orang tua"
          value={parentPhone}
          onChange={setParentPhone}
        />
      </div>
      {updateState.phoneChanged && !hasValidPhoneLength ? (
        <Callout variant="warning">
          <strong>No. HP Orang Tua belum lengkap</strong>
          <p>Masukkan minimal 8 digit agar perubahan bisa lanjut ke review.</p>
        </Callout>
      ) : updateState.registeredToOtherParent && updateState.registeredAccount ? (
        <Callout variant="danger">
          <strong>Nomor dipakai Orang Tua lain</strong>
          <p>No. HP {updateState.nextPhone} sudah terdaftar sebagai akun Orang Tua {updateState.registeredAccount.name}. Gunakan nomor lain yang benar dan aktif.</p>
        </Callout>
      ) : updateState.phoneChanged ? (
        <Callout variant="warning">
          <strong>No. HP Orang Tua berubah</strong>
          <PointList items={[
            'Akun Anak bisa berpindah ke Orang Tua lain jika nomor ini berbeda.',
            'Perubahan ini tidak mengecek database. Pastikan nomor yang diisi benar dan aktif.',
          ]} />
        </Callout>
      ) : null}
    </div>
  )
}
function ParentBucketHeading({ name, phone, serial }: { name: string; phone: string; serial?: string }) {
  return (
    <div className="resolution-parent-heading">
      <div className="parent-heading-copy">
        <div className="candidate-heading">
          <strong>{name}</strong>
          <span>{phone}</span>
        </div>
        <div className="candidate-meta"><span className="identity-badge parent">Orang Tua</span><UserSerial value={serial} /></div>
      </div>
    </div>
  )
}
function ParentAccountCard({ account, active = false, matchedValue, onClick, showProfiles = true, variant = 'default' }: { account: ParentProfileAccount; active?: boolean; matchedValue?: string; onClick?: () => void; showProfiles?: boolean; variant?: 'default' | 'success' }) {
  return (
    <div className={variant === 'success' ? 'parent-account-card success' : 'parent-account-card'}>
      {variant === 'success' && <span className="parent-card-status"><CheckCircle2 size={14} /> Orang Tua ditemukan</span>}
      <AccountRelationCard
        active={active}
        matchedValue={matchedValue}
        mode="parent-first"
        parentName={account.name}
        parentPhone={account.phone}
        parentSerial={account.serial}
        profiles={showProfiles ? account.profiles : []}
        onClick={onClick}
      />
    </div>
  )
}
function ChildTargetCandidateCard({ active, hideParentDetail = false, matchedValue, onClick, profile }: { active: boolean; hideParentDetail?: boolean; matchedValue?: string; onClick: () => void; profile: ChildProfile }) {
  return (
    <AccountRelationCard
      active={active}
      matchedValue={matchedValue}
      mode="child-first"
      parentName={profile.parentName ?? 'Orang Tua'}
      parentPhone={profile.parentPhone ?? '-'}
      parentSerial={profile.parentSerial}
      profile={profile}
      showNestedParent={!hideParentDetail}
      onClick={onClick}
    />
  )
}
function NewChildTargetCard({ active, hasProfiles, onClick }: { active: boolean; hasProfiles: boolean; onClick: () => void }) {
  const className = ['account-relation-card', 'child-first', 'new-child-target', 'interactive', active ? 'active' : ''].filter(Boolean).join(' ')

  return (
    <button className={className} type="button" aria-pressed={active} onClick={onClick}>
      <div className="relation-identity child">
        <div className="relation-title-row">
          <span className="identity-badge child">Anak</span>
          <strong>Buat Anak Baru</strong>
        </div>
        <div className="relation-meta-row">
          <span className="new-child-inline-icon" aria-hidden="true"><Plus size={14} /></span>
          <span>{hasProfiles ? 'Belum ada di daftar' : 'Belum punya Anak'}</span>
        </div>
        <small className="grade-line">{hasProfiles ? 'Gunakan jika Anak belum ada di daftar.' : 'Wajib dibuat sebelum paket diaktifkan.'}</small>
      </div>
      <span className="profile-radio" aria-hidden="true" />
    </button>
  )
}
function SearchTargetCard({ actionLabel, matchedValue, profile, onAction }: {
  actionLabel: string
  matchedValue?: string
  profile?: ChildProfile
  onAction: () => void
}) {
  if (!profile) return null

  return (
    <div className="search-target-card selected">
      <div className="search-target-head">
        <div>
          <span className="summary-kicker">Profil Terpilih</span>
          <strong>Profil Anak terpilih</strong>
        </div>
        <button type="button" onClick={onAction}>{actionLabel}</button>
      </div>
      <AccountRelationCard
        matchedValue={matchedValue}
        mode="child-first"
        parentName={profile.parentName ?? 'Orang Tua'}
        parentPhone={profile.parentPhone ?? '-'}
        parentSerial={profile.parentSerial}
        profile={profile}
      />
    </div>
  )
}

function SelectedTargetSummary({ actionLabel = 'Ubah', matchedValue, onAction, parentName, parentPhone, parentSerial, profile }: { actionLabel?: string; matchedValue?: string; onAction?: () => void; parentName: string; parentPhone: string; parentSerial?: string; profile: ChildProfile }) {
  return (
    <div className="selected-target-wrapper" aria-label="Profil tujuan paket terpilih">
      <SearchTargetCard
        actionLabel={actionLabel}
        matchedValue={matchedValue}
        profile={{ ...profile, parentName, parentPhone, parentSerial }}
        onAction={onAction ?? (() => {})}
      />
    </div>
  )
}

function DuplicateProfileWarning({ acknowledged, matches, onAcknowledge, onUseProfile }: {
  acknowledged: boolean
  matches: ChildProfile[]
  onAcknowledge: () => void
  onUseProfile: (profile: ChildProfile) => void
}) {
  if (matches.length === 0) return null

  return (
    <Callout className="duplicate-profile-warning" variant="warning">
      <strong>Profil mirip sudah ada</strong>
      <PointList items={[
        'Cek lagi apakah paket seharusnya diarahkan ke profil yang sudah ada.',
        acknowledged ? 'Agent memilih tetap membuat Anak baru.' : 'Pilih profil yang benar atau konfirmasi tetap buat profil baru.',
      ]} />
      <div className="duplicate-profile-list">
        {matches.map((profile) => (
          <button key={profile.id} type="button" onClick={() => onUseProfile(profile)}>
            <span>{profile.name}</span>
            <small>{profile.grade}{profile.hasActivePackage ? ' · Paket aktif' : ''}</small>
            <small><UserSerial value={profile.serial} /></small>
          </button>
        ))}
      </div>
      {!acknowledged && (
        <button className="inline-action duplicate-ack" type="button" onClick={onAcknowledge}>Tetap Buat Profil Baru</button>
      )}
    </Callout>
  )
}

function LookupStage({
  accountStatus,
  checkNumber,
  contactOwner,
  isBeforeAfterMapping,
  isExplicitMapping,
  legacyAccountSelected,
  lookupState,
  lookupPickerOpen,
  parentUpdateName,
  parentUpdatePhone,
  phone,
  profileTarget,
  selectedChildProfileId,
  setAccountStatus,
  setContactOwner,
  selectedChildSearchProfileId,
  setLegacyAccountSelected,
  setLookupState,
  setLookupPickerOpen,
  setPhone,
  setPackageIntent,
  setProfileTarget,
  setSelectedChildProfileId,
  setSelectedChildSearchProfileId,
}: {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  legacyAccountSelected: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  parentUpdateName: string
  parentUpdatePhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setContactOwner: (value: ContactOwner) => void
  setLegacyAccountSelected: (value: boolean) => void
  setLookupState: (value: LookupState) => void
  setLookupPickerOpen: (value: boolean) => void
  setPhone: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
}) {
  if (!accountStatus) {
    return (
      <StagePanel className="divided muted-stage" step="TAHAP 2" title="Pilih status akun terlebih dahulu">
        <Callout className="lookup-hint">
          <strong>Arahan untuk Agent</strong>
          <p>Pilih salah satu status di Tahap 1 agar sistem tahu apakah nomor yang dicek adalah akun lama atau akun orang tua baru.</p>
        </Callout>
      </StagePanel>
    )
  }

  const isExistingFlow = accountStatus === 'existing'
  const title = isExistingFlow ? 'Cari Akun / Profil Ruangguru Saat Ini' : 'Masukkan no. HP Orang Tua'
  const selectedLookupProfile = (isSearchResolutionLookup(lookupState) || lookupState === 'existing-old-account-with-child-profile-contact')
    ? childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId)
    : undefined
  const selectedLookupParentAccount = selectedLookupProfile ? getParentAccountFromChildProfile(selectedLookupProfile) : null
  const selectedLookupParentUpdateState = selectedLookupParentAccount ? getParentUpdateState(selectedLookupParentAccount, parentUpdateName, parentUpdatePhone) : null
  return (
    <StagePanel className="divided" step="TAHAP 2" title={title}>
      <div className="lookup-row">
        <input
          value={phone}
          placeholder="No. HP / User serial"
          onChange={(event) => setPhone(event.target.value)}
          aria-label={isExistingFlow ? 'No. HP atau User Serial customer' : 'Nomor HP orang tua'}
        />
        <button type="button" onClick={checkNumber}>Cek Akun</button>
      </div>
      {lookupState === 'idle' && (
        <Callout className="lookup-hint">
          <strong>Arahan untuk Agent</strong>
          <p>{isExistingFlow ? 'Input No. HP atau User Serial yang diberikan customer.' : 'Input nomor orang tua yang akan menjadi Master Account. Sistem akan memastikan nomor ini belum terdaftar sebagai akun.'}</p>
        </Callout>
      )}
      {lookupState === 'existing-old-account-with-child-profile-contact' ? (
        <OldAccountPickerTrigger
          legacyAccountSelected={legacyAccountSelected}
          matchedValue={phone}
          profiles={getOldAccountProfileContactMatches(lookupState)}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          onOpen={() => setLookupPickerOpen(true)}
        />
      ) : lookupState === 'existing-old-account' && !legacyAccountSelected ? (
        <OldAccountPickerTrigger
          legacyAccountSelected={legacyAccountSelected}
          matchedValue={phone}
          profiles={[]}
          selectedChildSearchProfileId=""
          onOpen={() => setLookupPickerOpen(true)}
        />
      ) : lookupState === 'existing-old-account' && (
        isExplicitMapping || isBeforeAfterMapping ? (
          <FoundAccount
            contactOwner={contactOwner}
            isBeforeAfterMapping={isBeforeAfterMapping}
            isExplicitMapping={isExplicitMapping}
            phone={phone}
            setContactOwner={setContactOwner}
          />
        ) : (
          <OldAccountPickerTrigger
            legacyAccountSelected={legacyAccountSelected}
            matchedValue={phone}
            profiles={[]}
            selectedChildSearchProfileId=""
            onOpen={() => setLookupPickerOpen(true)}
          />
        )
      )}

      {isSearchResolutionLookup(lookupState) && (
        <>
          {!selectedLookupProfile && (
            <LookupPickerTrigger
              lookupState={lookupState}
              matchedValue={phone}
              selectedChildSearchProfileId={selectedChildSearchProfileId}
              onOpen={() => setLookupPickerOpen(true)}
            />
          )}
          {selectedLookupProfile && (
            <div className="lookup-main-review compact-selected-target">
              <SelectedTargetSummary
                actionLabel="Ubah"
                onAction={() => setLookupPickerOpen(true)}
                matchedValue={phone}
                parentName={selectedLookupParentUpdateState?.nextName ?? selectedLookupProfile.parentName ?? 'Orang Tua'}
                parentPhone={selectedLookupParentUpdateState?.nextPhone ?? selectedLookupProfile.parentPhone ?? '-'}
                parentSerial={selectedLookupProfile.parentSerial}
                profile={selectedLookupProfile}
              />
            </div>
          )}
        </>
      )}
      {isLookupNoticeState(lookupState) && <LookupNoticeTrigger lookupState={lookupState} phone={phone} onOpen={() => setLookupPickerOpen(true)} />}
      {lookupState === 'existing-old-account' && lookupPickerOpen && (
        <OldAccountPickerSheet
          legacyAccountSelected={legacyAccountSelected}
          matchedValue={phone}
          profiles={[]}
          selectedChildSearchProfileId=""
          setLegacyAccountSelected={setLegacyAccountSelected}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
      {lookupState === 'existing-old-account-with-child-profile-contact' && lookupPickerOpen && (
        <OldAccountPickerSheet
          legacyAccountSelected={legacyAccountSelected}
          matchedValue={phone}
          profiles={getOldAccountProfileContactMatches(lookupState)}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setLegacyAccountSelected={setLegacyAccountSelected}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
      {isLookupNoticeState(lookupState) && lookupPickerOpen && (
        <LookupNoticeSheet
          lookupState={lookupState}
          phone={phone}
          setAccountStatus={setAccountStatus}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
      {(isSearchResolutionLookup(lookupState) || isParentProfileLookup(lookupState)) && lookupPickerOpen && (
        <LookupPickerSheet
          lookupState={lookupState}
          matchedValue={phone}
          profileTarget={profileTarget}
          selectedChildProfileId={selectedChildProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setLookupState={setLookupState}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          onClose={() => setLookupPickerOpen(false)}
        />
      )}
    </StagePanel>
  )
}

function OldAccountPickerTrigger({ legacyAccountSelected, matchedValue, profiles, selectedChildSearchProfileId, onOpen }: {
  legacyAccountSelected: boolean
  matchedValue: string
  profiles: ChildProfile[]
  selectedChildSearchProfileId: string
  onOpen: () => void
}) {
  const selectedProfile = profiles.find((profile) => profile.id === selectedChildSearchProfileId)
  const showLegacyAccount = !profiles.some((profile) => profileSerialMatchesInput(profile, matchedValue))
  const optionCount = profiles.length + (showLegacyAccount ? 1 : 0)
  const hasSelection = legacyAccountSelected || Boolean(selectedProfile)
  const selectedKicker = legacyAccountSelected ? 'Akun Terpilih' : selectedProfile ? 'Profil Terpilih' : 'Hasil pencarian'
  const selectedTitle = legacyAccountSelected ? 'Akun lama terpilih' : selectedProfile ? 'Profil Anak terpilih' : 'Pilih tujuan paket'

  return (
    <div className="search-target-card">
      <div className="search-target-head">
        <div>
          <span className="summary-kicker">{selectedKicker}</span>
          <strong>{selectedTitle}</strong>
          {!hasSelection && <small>{optionCount} pilihan ditemukan dari data yang dimasukkan.</small>}
          {!hasSelection && <small>Buka daftar untuk memilih akun lama atau profil Anak.</small>}
        </div>
        <button type="button" onClick={onOpen}>{hasSelection ? 'Ubah' : 'Lihat'}</button>
      </div>
      {legacyAccountSelected && showLegacyAccount && <LegacyAccountCandidateCard matchedValue={matchedValue} />}
      {selectedProfile && (
        <AccountRelationCard
          matchedValue={matchedValue}
          mode="child-first"
          parentName={selectedProfile.parentName ?? 'Orang Tua'}
          parentPhone={selectedProfile.parentPhone ?? '-'}
          parentSerial={selectedProfile.parentSerial}
          profile={selectedProfile}
        />
      )}
    </div>
  )
}

function OldAccountPickerSheet({ legacyAccountSelected, matchedValue, profiles, selectedChildSearchProfileId, setLegacyAccountSelected, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId, onClose }: {
  legacyAccountSelected: boolean
  matchedValue: string
  profiles: ChildProfile[]
  selectedChildSearchProfileId: string
  setLegacyAccountSelected: (value: boolean) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
  onClose: () => void
}) {
  const showLegacyAccount = !profiles.some((profile) => profileSerialMatchesInput(profile, matchedValue))
  const hasSelection = (showLegacyAccount && legacyAccountSelected) || Boolean(selectedChildSearchProfileId)

  return (
    <BottomSheet className="lookup-picker-sheet" title="Pilih Tujuan Paket" onClose={onClose}>
      <ResultSummaryText childCount={profiles.length} matchedValue={matchedValue} oldAccountCount={showLegacyAccount ? 1 : 0} />
      <OldAccountResolutionResults
        legacyAccountSelected={legacyAccountSelected}
        matchedValue={matchedValue}
        profiles={profiles}
        selectedChildSearchProfileId={selectedChildSearchProfileId}
        showLegacyAccount={showLegacyAccount}
        setLegacyAccountSelected={setLegacyAccountSelected}
        setPackageIntent={setPackageIntent}
        setProfileTarget={setProfileTarget}
        setSelectedChildProfileId={setSelectedChildProfileId}
        setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
      />
      <button className="sheet-primary" disabled={!hasSelection} type="button" onClick={onClose}>Pilih Tujuan</button>
    </BottomSheet>
  )
}

function LegacyAccountCandidateCard({ active = false, matchedValue, onClick }: { active?: boolean; matchedValue: string; onClick?: () => void }) {
  const className = ['account-relation-card', 'legacy-account-card', active ? 'active' : '', onClick ? 'interactive' : ''].filter(Boolean).join(' ')
  const serialMatched = serialMatchesInput(existingAccount.serial, matchedValue)
  const body = (
    <>
      <div className="relation-identity account">
        <div className="relation-title-row">
          <span className="identity-badge account">Akun lama</span>
          <strong>{existingAccount.name}</strong>
        </div>
        <div className="relation-meta-row">
          <HighlightedMatch match={matchedValue} value={existingAccount.phone} />
          <HighlightedMatch match={serialMatched ? matchedValue : undefined} value={`SN ${existingAccount.serial}`} />
        </div>
        <div className="relation-status-row">
          <LeadStatusBadge status={existingAccount.leadStatus} />
          <LastLoginLine value={existingAccount.lastLoginAt} />
        </div>
        <small className="grade-line">Belum migrasi. Pilih ini jika paket untuk akun lama yang akan dikonversi.</small>
      </div>
      {onClick && <span className="profile-radio" aria-hidden="true" />}
    </>
  )

  if (onClick) return <button className={className} type="button" aria-pressed={active} onClick={onClick}>{body}</button>
  return <div className={className}>{body}</div>
}

function LegacyAccountFoundResult({ matchedValue }: { matchedValue: string }) {
  return (
    <div className="search-resolution old-account-resolution">
      <div className="resolution-group result-list-shell">
        <span className="resolution-label">Akun lama ditemukan</span>
        <div className="resolution-profile-groups">
          <LegacyAccountCandidateCard matchedValue={matchedValue} />
        </div>
      </div>
    </div>
  )
}

function OldAccountResolutionResults({ legacyAccountSelected, matchedValue, profiles, selectedChildSearchProfileId, showLegacyAccount, setLegacyAccountSelected, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId }: {
  legacyAccountSelected: boolean
  matchedValue: string
  profiles: ChildProfile[]
  selectedChildSearchProfileId: string
  showLegacyAccount: boolean
  setLegacyAccountSelected: (value: boolean) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
}) {
  const selectLegacyAccount = () => {
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setProfileTarget(null)
    setPackageIntent(null)
    setLegacyAccountSelected(true)
  }

  const selectChildProfile = (profile: ChildProfile) => {
    setLegacyAccountSelected(false)
    setProfileTarget('existing')
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId(profile.id)
    setPackageIntent(null)
  }

  return (
    <div className="search-resolution old-account-resolution">
      <div className="result-section-stack">
        {showLegacyAccount && (
          <div className="resolution-group result-list-shell">
            <span className="resolution-label">Akun lama</span>
            <div className="resolution-profile-groups">
              <LegacyAccountCandidateCard active={legacyAccountSelected} matchedValue={matchedValue} onClick={selectLegacyAccount} />
            </div>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="resolution-group result-list-shell">
            <span className="resolution-label">Profil Anak</span>
            <div className="resolution-profile-groups">
              {profiles.map((profile) => (
                <ChildTargetCandidateCard
                  active={selectedChildSearchProfileId === profile.id}
                  key={profile.id}
                  matchedValue={matchedValue}
                  profile={profile}
                  onClick={() => selectChildProfile(profile)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FoundAccount({
  contactOwner,
  isBeforeAfterMapping,
  isExplicitMapping,
  phone,
  setContactOwner,
}: {
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  phone: string
  setContactOwner: (value: ContactOwner) => void
}) {
  if (isBeforeAfterMapping) {
    return <BeforeAfterMappingPanel contactOwner={contactOwner} phone={phone} setContactOwner={setContactOwner} />
  }

  if (isExplicitMapping) {
    return (
      <>
<LegacyAccountFoundResult matchedValue={phone} />
        <div className="mapping-decision">
          <h3 className="small-title">Kontak akun lama dipakai untuk</h3>
          <div className="segmented-control" role="radiogroup" aria-label="Kontak akun lama dipakai untuk">
            <button
              className={contactOwner === 'child' ? 'segment-button active' : 'segment-button'}
              type="button"
              aria-pressed={contactOwner === 'child'}
              onClick={() => setContactOwner('child')}
            >
              <span>Anak</span>
              <small>Isi data manual</small>
            </button>
            <button
              className={contactOwner === 'parent' ? 'segment-button active' : 'segment-button'}
              type="button"
              aria-pressed={contactOwner === 'parent'}
              onClick={() => setContactOwner('parent')}
            >
              <span>Data Orang Tua</span>
              <small>Isi data manual</small>
            </button>
          </div>
        </div>
        <Callout variant={contactOwner === 'parent' ? 'warning' : 'info'}>
          <strong>{contactOwner ? 'Dampak pilihan' : 'Aksi berikutnya'}</strong>
          <PointList items={contactOwner === 'parent' ? [
            'No. HP akun lama menjadi prefill No. HP Orang Tua dan tetap bisa diedit.',
            'Data Anak harus diisi dari informasi pembeli.',
            'Pastikan nomor Orang Tua benar dan aktif.',
          ] : contactOwner === 'child' ? [
            'Data akun lama otomatis menjadi prefill Data Anak.',
            'Isi atau koreksi Data Orang Tua sesuai informasi pembeli.',
            'Anak tetap tidak bisa login dengan No. HP/email setelah migrasi.',
          ] : [
            'Pilih Anak jika No. HP/email akun lama adalah milik siswa.',
            'Pilih Data Orang Tua jika No. HP/email akun lama adalah milik orang tua.',
          ]} />
        </Callout>
      </>
    )
  }

  return (
    <>
<LegacyAccountFoundResult matchedValue={phone} />
      <Callout>
        <strong>Arahan untuk Agent</strong>
        <PointList items={[
          'Pastikan ini akun aktif yang akan dibelikan paket.',
          'Keputusan No. HP akun lama milik anak atau orang tua diisi di Tahap 3.',
        ]} />
      </Callout>
    </>
  )
}

function MigrationIdentityToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div className="migration-identity-toggle">
      <ToggleRow checked={checked} label="No. HP akun lama adalah milik orang tua" onClick={onChange} />
    </div>
  )
}

function BeforeAfterMappingPanel({ contactOwner, phone, setContactOwner }: {
  contactOwner: ContactOwner
  phone: string
  setContactOwner: (value: ContactOwner) => void
}) {
  return (
    <>
      <div className="structure-map" aria-label="Struktur sebelum dan sesudah migrasi">
        <div className="structure-panel before">
          <span>Sebelum migrasi</span>
          <strong>1 akun lama</strong>
          <AccountResult label="Akun lama" name={existingAccount.name} phone={phone} serial={existingAccount.serial} />
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{existingAccount.email}</dd>
            </div>
          </dl>
        </div>

        <div className="structure-transform">Diubah menjadi</div>

        <div className="structure-panel after">
          <span>Sesudah migrasi</span>
          <strong>Orang Tua + Anak</strong>
          <div className="target-stack">
            <StructureTargetButton
              active={contactOwner === 'parent'}
              description="Kontak akun lama dikenali sebagai milik orang tua."
              label="Pilih"
              title="Orang Tua"
              onClick={() => setContactOwner('parent')}
            />
            <StructureTargetButton
              active={contactOwner === 'child'}
              description="Kontak akun lama dikenali sebagai milik anak."
              label="Pilih"
              title="Anak"
              onClick={() => setContactOwner('child')}
            />
          </div>
        </div>
      </div>

      <Callout variant={contactOwner === 'parent' ? 'warning' : 'info'}>
        <strong>{contactOwner ? 'Dampak migrasi' : 'Aksi berikutnya'}</strong>
        <PointList items={contactOwner === 'parent' ? [
          'No. HP akun lama menjadi prefill No. HP Orang Tua dan tetap bisa diedit.',
          'Data Anak harus diisi dari informasi pembeli.',
          'Username dan PIN anak dikirim ke WhatsApp Orang Tua setelah transaksi berhasil.',
        ] : contactOwner === 'child' ? [
          'Data akun lama otomatis menjadi prefill Data Anak.',
          'Isi atau koreksi Data Orang Tua sesuai informasi pembeli.',
          'No. HP/email anak tersimpan sebagai data profil, bukan akses login.',
        ] : [
          'Pilih Orang Tua jika kontak akun lama milik orang tua.',
          'Pilih Anak jika kontak akun lama milik siswa.',
        ]} />
      </Callout>
    </>
  )
}

function StructureTargetButton({ active, description, label, onClick, title }: {
  active: boolean
  description: string
  label: string
  onClick: () => void
  title: string
}) {
  return (
    <button className={active ? 'structure-target active' : 'structure-target'} type="button" onClick={onClick}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span>{active ? 'Terpilih' : label}</span>
    </button>
  )
}

function MigrationStateSummary({ contactOwner, phone }: { contactOwner: Exclude<ContactOwner, null>; phone: string }) {
  const contactLabel = contactOwner === 'parent' ? 'Data Orang Tua' : 'Anak'
  const helper = contactOwner === 'parent' ? 'Isi data dari pembeli di form berikutnya' : 'Isi data dari pembeli di form berikutnya'

  return (
    <div className="state-summary" aria-label="Ringkasan mapping akun lama">
      <div>
        <span>Akun aktif</span>
        <strong>{existingAccount.name}</strong>
        <small>{phone}</small>
      </div>
      <div>
        <span>Kontak akun lama</span>
        <strong>{contactLabel}</strong>
        <small>{helper}</small>
      </div>
    </div>
  )
}

function getLookupNoticeCopy(lookupState: LookupState, phone: string) {
  const isSerialInput = isSerialLookupInput(phone)

  if (lookupState === 'existing-not-registered') {
    if (isSerialInput) {
      return {
        title: 'User serial tidak ditemukan',
        tone: 'danger' as CalloutVariant,
        summary: 'User serial ' + phone + ' tidak terdaftar sebagai user aktif.',
        detail: 'Cek kembali user serial atau gunakan No. HP.',
        actionLabel: 'Pindah ke Belum Punya Akun',
        nextStatus: 'new' as AccountStatus,
      }
    }

    return {
      title: 'Akun tidak ditemukan',
      tone: 'danger' as CalloutVariant,
      summary: 'Nomor ini belum terdaftar sebagai akun Ruangguru.',
      detail: 'Pakai Belum Punya Akun atau cari No. HP/user serial lain.',
      actionLabel: 'Pindah ke Belum Punya Akun',
      nextStatus: 'new' as AccountStatus,
    }
  }

  if (lookupState === 'existing-child-phone') {
    return {
      title: 'Bukan akun login',
      tone: 'danger' as CalloutVariant,
      summary: 'Data ini terdeteksi sebagai kontak Anak.',
      detail: 'Cari akun aktif lain, atau buat struktur baru jika customer belum punya akun.',
      actionLabel: 'Pindah ke Belum Punya Akun',
      nextStatus: 'new' as AccountStatus,
    }
  }

  if (lookupState === 'new-registered') {
    if (isSerialInput) {
      return {
        title: 'User serial hanya untuk akun yang sudah daftar',
        tone: 'danger' as CalloutVariant,
        summary: 'User serial tidak dipakai untuk membuat akun Orang Tua baru.',
        detail: 'Pindah ke Sudah Punya Akun untuk mencari tujuan paket dengan user serial.',
        actionLabel: 'Pindah ke Sudah Punya Akun',
        nextStatus: 'existing' as AccountStatus,
      }
    }

    return {
      title: 'Nomor sudah terdaftar',
      tone: 'danger' as CalloutVariant,
      summary: 'Nomor ini sudah melekat ke akun Ruangguru.',
      detail: 'Pindah ke Sudah Punya Akun untuk memilih tujuan paket.',
      actionLabel: 'Pindah ke Sudah Punya Akun',
      nextStatus: 'existing' as AccountStatus,
    }
  }

  return {
    title: 'Nomor bisa digunakan',
    tone: 'success' as CalloutVariant,
    summary: phone ? phone + ' belum terdaftar sebagai akun Ruangguru.' : 'Nomor belum terdaftar sebagai akun Ruangguru.',
    detail: 'Lanjut isi Data Orang Tua dan Anak.',
  }
}

function LookupNoticeTrigger({ lookupState, onOpen, phone }: { lookupState: LookupState; onOpen: () => void; phone: string }) {
  const copy = getLookupNoticeCopy(lookupState, phone)

  return (
    <button className={['lookup-notice-trigger', copy.tone].join(' ')} type="button" onClick={onOpen}>
      <span>{copy.title}</span>
      <small>{copy.summary}</small>
      <ChevronRight size={16} />
    </button>
  )
}

function LookupNoticeSheet({ lookupState, onClose, phone, setAccountStatus }: { lookupState: LookupState; onClose: () => void; phone: string; setAccountStatus: (value: AccountStatus) => void }) {
  const copy = getLookupNoticeCopy(lookupState, phone)
  const registeredAccount = lookupState === 'new-registered' && !isSerialLookupInput(phone) ? getRegisteredParentAccount(phone) : null
  const handleAction = () => {
    if (!copy.nextStatus) return
    onClose()
    setAccountStatus(copy.nextStatus)
  }

  return (
    <BottomSheet className="lookup-notice-sheet" title="Hasil Cek Akun" onClose={onClose}>
      <Callout className="lookup-notice-card" variant={copy.tone}>
        <strong>{copy.title}</strong>
        <p>{copy.summary}</p>
        <small>{copy.detail}</small>
      </Callout>
      {registeredAccount && (
        <AccountResult
          name={registeredAccount.name}
          phone={registeredAccount.phone}
          serial={registeredAccount.serial}
          statusLabel="Akun terdaftar"
        />
      )}
      {copy.actionLabel ? (
        <button className="sheet-primary" type="button" onClick={handleAction}>{copy.actionLabel}</button>
      ) : (
        <button className="sheet-primary" type="button" onClick={onClose}>Mengerti</button>
      )}
    </BottomSheet>
  )
}
function AccountResult({ description, label = 'Akun', name, phone, serial, statusLabel }: { description?: string; label?: string; name: string; phone: string; serial?: string; statusLabel?: string }) {
  return (
    <div className={statusLabel ? 'account-relation-card account-result-card success' : 'account-relation-card account-result-card'}>
      <div className="relation-identity account">
        {statusLabel && <span className="parent-card-status"><CheckCircle2 size={14} /> {statusLabel}</span>}
        <div className="relation-title-row">
          <span className="identity-badge account">{label}</span>
          <strong>{name}</strong>
        </div>
        <div className="relation-meta-row">
          <span>{phone}</span>
          <UserSerial value={serial} />
        </div>
        {description && <small className="grade-line">{description}</small>}
      </div>
    </div>
  )
}
function ToggleRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button className={checked ? 'toggle-row on' : 'toggle-row'} type="button" onClick={onClick}>
      <span>{label}</span>
      <span className="switch" aria-hidden="true" />
    </button>
  )
}

function AccountForm({
  childEmail,
  childName,
  childPhone,
  grade,
  mode,
  migrationIdentityToggle,
  parentPhone,
  prefilledParentPhone,
  usesParentIdentity,
  setChildEmail,
  setChildName,
  setChildPhone,
  setGrade,
  setParentPhone,
}: AccountFormProps) {
  const isMigration = mode === 'migration'
  const shouldCheckParentPhone = isMigration && !usesParentIdentity
  const parentPhoneAccount = shouldCheckParentPhone ? getRegisteredParentAccount(parentPhone) : null
  const parentPhoneIsCheckable = shouldCheckParentPhone && canCheckParentPhone(parentPhone)
  const parentPhoneChangedFromPrefill = Boolean(
    usesParentIdentity
    && prefilledParentPhone
    && normalizePhoneDigits(parentPhone) !== normalizePhoneDigits(prefilledParentPhone),
  )
  return (
    <div className="form-fields">
      <ActiveDataNote />
      <h4>Data Orang Tua</h4>
      {migrationIdentityToggle}
      <TextField
        helper={usesParentIdentity ? 'Terisi otomatis dari akun lama. Ubah hanya jika customer memberi nomor Orang Tua yang benar dan aktif.' : 'Pastikan nomor ini adalah nomor yang benar dan aktif.'}
        label="No. HP Orang Tua"
        placeholder="Masukan no. HP orang tua"
        value={parentPhone}
        onChange={setParentPhone}
      />
      {shouldCheckParentPhone && parentPhoneIsCheckable && (
        <ParentPhoneCheckResult account={parentPhoneAccount} phone={parentPhone} />
      )}
      {parentPhoneChangedFromPrefill && (
        <Callout variant="warning">
          <strong>No. HP Orang Tua berubah</strong>
          <PointList items={[
            'Akun Anak bisa berpindah ke Orang Tua lain jika nomor ini berbeda.',
            'Perubahan ini tidak mengecek database. Pastikan nomor yang diisi benar dan aktif.',
          ]} />
        </Callout>
      )}
      <h4>Data Anak</h4>
      <TextField label="Nama Lengkap Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak, bukan akses login utama. Nomor boleh sama dengan milik orang tua."
        label="No. HP Anak"
        placeholder="Masukan no. HP anak"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak, bukan akses login utama. Email boleh sama dengan milik orang tua."
        label="Email Anak"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout className="strong">
        <strong>Yang perlu diberitahu ke anak/orang tua</strong>
        <PointList items={[
          'Username dan PIN dikirim ke WhatsApp Orang Tua setelah transaksi berhasil.',
        ]} />
      </Callout>
    </div>
  )
}

function ParentPhoneCheckResult({ account, phone }: { account: typeof registeredParentAccount | null; phone: string }) {
  if (!account) {
    return (
      <Callout icon={<CheckCircle2 size={16} />} variant="success">
        <strong>No. HP belum terdaftar sebagai akun Ruangguru</strong>
        <p>Nomor {phone} dapat digunakan untuk membuat Orang Tua baru.</p>
      </Callout>
    )
  }

  return (
    <>
      <AccountResult
        label="Orang Tua"
        name={account.name}
        phone={account.phone}
        serial={account.serial}
        statusLabel="Akun Orang Tua ditemukan"
        description="No. HP ini sudah bisa dipakai sebagai Orang Tua."
      />
      <Callout>
        <strong>Instruksi</strong>
        <PointList items={[
          `Pastikan No. HP ${phone} adalah akun orang tua dan bisa diakses.`,
          <>Jika lanjut, Anak berelasi dengan akun <strong>{account.name}</strong>.</>,
        ]} />
      </Callout>
    </>
  )
}

type AccountFormProps = {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  mode: 'migration' | 'new'
  migrationIdentityToggle?: ReactNode
  parentPhone: string
  prefilledParentPhone?: string
  usesParentIdentity: boolean
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
  setParentPhone: (value: string) => void
}

function ReadonlyTextInput({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span className="field-label-row"><span>{label}</span></span>
      <input autoComplete="off" readOnly value={value} />
    </label>
  )
}

function TextField({ helper, label, onChange, placeholder, readOnly = false, value }: {
  helper?: string
  label: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  value: string
}) {
  return (
    <label className={readOnly ? 'locked-field' : undefined}>
      <span className="field-label-row">
        <span>{label}</span>
        {readOnly && <span className="locked-chip"><Lock size={11} /> Dikunci</span>}
      </span>
      <input
        aria-readonly={readOnly}
        autoComplete="off"
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {helper && <small>{helper}</small>}
    </label>
  )
}

function SelectField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Pilih Kelas</option>
        <option>Kelas 10 SMA</option>
        <option>Kelas 11 SMA</option>
        <option>Kelas 12 SMA</option>
      </select>
    </label>
  )
}

function DiscountCard() {
  return (
    <SectionCard className="discount-card" title="Gunakan kode diskon">
      <ActionRow icon={<Check size={18} />} meta="Potongan harga Rp9.000" title="PROMODIWEB" />
    </SectionCard>
  )
}

function ActionRow({ icon, meta, title }: { icon: ReactNode; meta: string; title: string }) {
  return (
    <div className="action-row">
      {icon}
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      <ChevronRight size={20} />
    </div>
  )
}

function PaymentDetailCard() {
  return (
    <SectionCard className="payment-card" title="Detail Pembayaran">
      <PaymentRow label="ruangbelajar SMA/SMK 1 Tahun" value="Rp 889.000" />
      <PaymentRow label="Nominal Diskon" value="-Rp 9.000" />
      <p className="policy-text">Dengan menekan tombol di bawah ini, kamu menyatakan</p>
    </SectionCard>
  )
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="payment-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BottomCta({ contextLabel = 'Total Harga', contextValue = 'Rp880.000', disabled, label, onClick }: {
  contextLabel?: string
  contextValue?: string
  disabled: boolean
  label: string
  onClick: () => void
}) {
  const isContextual = contextLabel !== 'Total Harga'

  return (
    <footer className={isContextual ? 'bottom-cta contextual-cta' : 'bottom-cta'}>
      <div>
        <span>{contextLabel}</span>
        <strong>{contextValue}</strong>
      </div>
      <button disabled={disabled} type="button" onClick={onClick}>{label}</button>
    </footer>
  )
}

function ReviewSheet({ accountStatus, childName, consent, grade, lookupState, parentName, parentPhone, phone, profileTarget, selectedChildProfileId, selectedChildSearchProfileId, setConsent, usesParentIdentity, onClose, onContinue }: {
  accountStatus: AccountStatus | null
  childName: string
  consent: boolean
  grade: string
  lookupState: LookupState
  parentName: string
  parentPhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  setConsent: (value: boolean) => void
  usesParentIdentity: boolean
  onClose: () => void
  onContinue: () => void
}) {
  const isNewAccount = accountStatus === 'new' && lookupState === 'new-available'
  const parentAccount = getLookupParentAccount(lookupState)
  const selectedProfile = parentAccount?.profiles.find((profile) => profile.id === selectedChildProfileId)
  const selectedSearchProfile = childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId)
  const parentLabel = usesParentIdentity ? parentName || 'Orang tua dari data akun lama' : parentName || 'Orang tua'
  const parentNumberLabel = usesParentIdentity ? phone : parentPhone || phone || 'yang diisi agent'
  const parentDisplayName = parentName || selectedSearchProfile?.parentName || parentAccount?.name || parentLabel
  const parentDisplayPhone = parentPhone || selectedSearchProfile?.parentPhone || parentAccount?.phone || parentNumberLabel
  const targetProfileName = selectedSearchProfile
    ? selectedSearchProfile.name
    : parentAccount
    ? profileTarget === 'existing' && selectedProfile
      ? selectedProfile.name
      : childName || 'Anak baru'
    : isNewAccount || usesParentIdentity
      ? childName || 'Anak baru'
      : existingAccount.name
  const targetGrade = selectedSearchProfile?.grade ?? (parentAccount && profileTarget === 'existing' && selectedProfile ? selectedProfile.grade : grade || '-')
  const usesExistingProfile = Boolean(selectedSearchProfile || (parentAccount && profileTarget === 'existing' && selectedProfile))
  const reviewType = selectedSearchProfile || parentAccount ? 'Aktivasi paket' : isNewAccount ? 'Pembuatan akun' : 'Konversi akun'
  const title = selectedSearchProfile || parentAccount ? 'Review tujuan paket' : isNewAccount ? 'Review pembuatan akun' : 'Review migrasi akun'
  const accessCopy = parentAccount || isNewAccount ? 'Username dan PIN dikirim ke WhatsApp Orang Tua.' : 'Login anak berubah ke Username dan PIN.'
  const parentPhoneWillChange = Boolean(selectedSearchProfile && parentPhone && normalizePhoneDigits(parentPhone) !== normalizePhoneDigits(selectedSearchProfile.parentPhone ?? ''))
  const changeOverviewItems = [
    parentPhoneWillChange ? `No. HP Orang Tua diubah dari ${selectedSearchProfile?.parentPhone} ke ${parentPhone}.` : null,
    !usesExistingProfile ? accessCopy : null,
  ].filter(Boolean) as string[]
  const consentCopy = 'Saya sudah memastikan data Orang Tua dan Anak benar, aktif, dan sesuai dengan informasi customer.'
  const reviewProfile: ChildProfile = {
    contact: selectedSearchProfile?.contact ?? selectedProfile?.contact ?? undefined,
    grade: targetGrade,
    hasActivePackage: selectedSearchProfile?.hasActivePackage ?? selectedProfile?.hasActivePackage,
    id: selectedSearchProfile?.id ?? selectedProfile?.id ?? 'review-child-target',
    name: targetProfileName,
    packageName: selectedSearchProfile?.packageName ?? selectedProfile?.packageName,
    packageNames: selectedSearchProfile?.packageNames ?? selectedProfile?.packageNames,
    parentName: parentDisplayName,
    parentPhone: parentDisplayPhone,
    parentSerial: selectedSearchProfile?.parentSerial ?? parentAccount?.serial,
    serial: selectedSearchProfile?.serial ?? selectedProfile?.serial ?? '',
  }

  return (
    <BottomSheet title={title} onClose={onClose}>
      <div className="wizard-review scan-review sheet-review">
        <ReviewTargetCard
          parentName={parentDisplayName}
          parentPhone={parentDisplayPhone}
          parentSerial={selectedSearchProfile?.parentSerial ?? parentAccount?.serial}
          profile={reviewProfile}
          typeLabel={reviewType}
        />

        {changeOverviewItems.length > 0 && (
          <ReviewChangeOverview items={changeOverviewItems} />
        )}


        <label className="consent-row review-consent">
          <input checked={consent} type="checkbox" onChange={(event) => setConsent(event.target.checked)} />
          <span>{consentCopy}</span>
        </label>
      </div>
      <button className="sheet-primary" disabled={!consent} type="button" onClick={onContinue}>Lanjut Pilih Metode Bayar</button>
    </BottomSheet>
  )
}

function BottomSheet({ children, className = '', onClose, title }: { children: ReactNode; className?: string; onClose: () => void; title?: string }) {
  return (
    <div className="sheet-backdrop">
      <section className={('bottom-sheet ' + className).trim()}>
        {title && (
          <div className="sheet-header">
            <h2>{title}</h2>
            <button type="button" aria-label="Tutup" onClick={onClose}><X size={18} /></button>
          </div>
        )}
        {children}
      </section>
    </div>
  )
}


function DoneSheet({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="success-sheet">
        <div className="success-mark"><Check size={26} /></div>
        <h2>Prototype sampai titik metode bayar</h2>
        <p>Di produksi, agent akan diarahkan ke pilihan metode bayar setelah review migrasi disetujui.</p>
        <button className="sheet-primary" type="button" onClick={onClose}>Kembali ke Draft Invoice</button>
      </div>
    </BottomSheet>
  )
}

export default App
