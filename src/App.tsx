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
type WizardStep = 1 | 2 | 3 | 4 | 5
type ChildProfile = {
  contact?: string
  grade: string
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
    steps: ['Cek akun lama', 'Pilih kontak milik Child/Parent', 'Cek No. HP orang tua', 'Review lalu pilih metode bayar'],
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
  name: 'Keisha Azzahra',
  email: 'keisha.azzahra@studentmail.test',
  serial: 'AZMIGD1L0YPTRBFD',
}

const registeredParentAccount = {
  name: 'Dimas Pratama',
  phone: '081298765432',
  serial: 'AZMIGD1L0YPTDMSP',
}

const parentAccountWithSingleChild: ParentProfileAccount = {
  name: 'Nadia Rahma',
  phone: '081381240015',
  serial: 'AZMIGD1L0YPTNDRH',
  profiles: [
    { contact: '081234700111', grade: 'Kelas 6 SD', id: 'rafa', name: 'Rafa Alfarizi', serial: 'AZMIGD1L0YPTRAAF' },
  ],
}

const parentAccountWithChildren: ParentProfileAccount = {
  name: 'Agus Salim',
  phone: '081276540022',
  serial: 'AZMIGD1L0YPTAGSL',
  profiles: [
    { contact: '081234700555', grade: 'Kelas 5 SD', id: 'xiera', name: 'Xiera Gentika', serial: 'AZMIGD1L0YPTXIGT' },
    { contact: '081234700555', grade: 'Kelas 8 SMP', hasActivePackage: true, id: 'salsabila', name: 'Salsabila Putri', packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'], serial: 'AZMIGD1L0YPTSBPT' },
  ],
}

const parentAccountWithoutChildren: ParentProfileAccount = {
  name: 'Maya Lestari',
  phone: '081399880044',
  profiles: [],
  serial: 'AZMIGD1L0YPTMYLS',
}

const singleChildProfileSearchResults: ChildProfile[] = [
  {
    contact: '081234700111',
    grade: 'Kelas 6 SD',
    id: 'child-rafa-nadia',
    name: 'Rafa Alfarizi',
    parentName: parentAccountWithSingleChild.name,
    parentPhone: parentAccountWithSingleChild.phone,
    parentSerial: parentAccountWithSingleChild.serial,
    serial: 'AZMIGD1L0YPTRAAF',
  },
]

const sameParentChildProfileSearchResults: ChildProfile[] = [
  {
    contact: '081234700555',
    grade: 'Kelas 7 SMP',
    id: 'child-xiera-agus',
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
    name: 'Keisha Azzahra',
    parentName: 'Ratih Pramesti',
    parentPhone: '081217003388',
    parentSerial: 'AZMIGD1L0YPTRTPR',
    serial: 'AZMIGD1L0YPTKZZA',
  },
]

const mixedChildProfileSearchResults: ChildProfile[] = [
  {
    contact: parentAccountWithChildren.phone,
    grade: 'Kelas 5 SD',
    id: 'child-xiera-agus-mixed',
    name: 'Xiera Gentika',
    parentName: parentAccountWithChildren.name,
    parentPhone: parentAccountWithChildren.phone,
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTXIMX',
  },
  {
    contact: parentAccountWithChildren.phone,
    grade: 'Kelas 8 SMP',
    hasActivePackage: true,
    id: 'child-salsabila-agus',
    name: 'Salsabila Putri',
    packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'],
    parentName: parentAccountWithChildren.name,
    parentPhone: parentAccountWithChildren.phone,
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTSBMX',
  },
]

const childProfileSearchResults: ChildProfile[] = [
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

  return normalizedPhone === parentAccountWithChildren.phone || normalizedPhone.includes('540022')
}

function isParentAccountWithSingleChildPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  return normalizedPhone === parentAccountWithSingleChild.phone || normalizedPhone.includes('240015')
}

function isParentAccountWithoutChildrenPhone(phone: string) {
  return phone.replace(/\D/g, '').includes('880044')
}

function isParentProfileLookup(lookupState: LookupState) {
  return lookupState === 'existing-parent-single-child' || lookupState === 'existing-parent-with-children' || lookupState === 'existing-parent-empty'
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

function getChildProfileSearchResults(lookupState: LookupState) {
  if (lookupState === 'existing-child-profile-contact') return singleChildProfileSearchResults
  if (lookupState === 'existing-child-profiles-same-parent') return sameParentChildProfileSearchResults
  if (lookupState === 'existing-child-profiles-cross-parent') return crossParentChildProfileSearchResults
  if (lookupState === 'existing-multiple-matches') return mixedChildProfileSearchResults

  return []
}

function getChildProfileParentCount(profiles: ChildProfile[]) {
  return new Set(profiles.map((profile) => profile.parentPhone)).size
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

function UserSerial({ value }: { value?: string }) {
  if (!value) return null

  return <span className="user-serial">SN {value}</span>
}


function isChildProfileContact(phone: string) {
  return phone.replace(/\D/g, '').includes('700111')
}

function isChildProfileLookupInput(value: string) {
  const normalizedValue = value.trim().toLowerCase()
  const numericValue = normalizedValue.replace(/\D/g, '')

  return numericValue.includes('700111')
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
  const [parentUpdateOpen, setParentUpdateOpen] = useState(false)
  const [parentUpdateName, setParentUpdateName] = useState('')
  const [parentUpdatePhone, setParentUpdatePhone] = useState('')

  const isExistingFlow = accountStatus === 'existing'
  const isOptionTwo = prototypeOption === '2'
  const isOptionThree = prototypeOption === '3'
  const usesMappingDecision = isOptionTwo || isOptionThree
  const hasContactOwnerDecision = !usesMappingDecision || contactOwner !== null
  const parentContactSelected = usesMappingDecision ? contactOwner === 'parent' : usesParentIdentity
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const parentUpdateState = parentLookupAccount ? getParentUpdateState(parentLookupAccount, parentUpdateName, parentUpdatePhone) : null
  const parentUpdateBlocked = Boolean(parentUpdateState?.registeredToOtherParent)
  const selectedChildSearchProfile = childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId) ?? null
  const selectedChildProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedChildProfileId) ?? selectedChildSearchProfile
  const shouldCreateProfileForParent = Boolean(parentLookupAccount && profileTarget === 'new')
  const duplicateProfileMatches = parentLookupAccount && shouldCreateProfileForParent ? getDuplicateProfileMatches(parentLookupAccount.profiles, childName) : []
  const duplicateProfileBlocking = duplicateProfileMatches.length > 0 && !duplicateProfileAcknowledged
  const searchProfileReady = Boolean(isSearchResolutionLookup(lookupState) && selectedChildSearchProfile)
  const showMigrationForm = isExistingFlow && lookupState === 'existing-old-account' && hasContactOwnerDecision
  const showNewAccountForm = accountStatus === 'new' && lookupState === 'new-available'
  const effectiveParentPhone = parentLookupAccount ? parentUpdateState?.nextPhone ?? parentLookupAccount.phone : showNewAccountForm ? parentPhone || phone : parentContactSelected ? phone : parentPhone
  const effectiveParentAccount = parentContactSelected || parentLookupAccount ? null : getRegisteredParentAccount(effectiveParentPhone)
  const effectiveParentName = parentLookupAccount ? parentUpdateState?.nextName ?? parentLookupAccount.name : effectiveParentAccount?.name || parentName || ''
  const effectiveChildName = selectedChildProfile?.name ?? childName
  const parentDataReady = Boolean(canCheckParentPhone(effectiveParentPhone) && effectiveParentName.trim())
  const multipleMatchReady = Boolean(lookupState === 'existing-multiple-matches' && selectedChildSearchProfile)
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
    && parentName.trim()
    && childName.trim()
    && grade,
  )
  const invoiceDetailReady = Boolean(searchProfileReady || parentProfileTargetReady || migrationFormReady || newAccountFormReady)
  const dynamicWizardSteps = getDynamicWizardSteps({
    accountStatus,
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
        if (lookupState === 'existing-old-account') return { label: 'Lanjut ke Mapping', disabled: false }
        if (isParentProfileLookup(lookupState)) return { label: 'Lanjut Pilih Profil', disabled: false }
        if (lookupState === 'existing-child-profile-contact') return { label: selectedChildSearchProfile ? 'Review Tujuan Paket' : 'Pilih Child', disabled: !searchProfileReady }
        if (lookupState === 'existing-child-profiles-same-parent' || lookupState === 'existing-child-profiles-cross-parent') return { label: selectedChildSearchProfile ? 'Review Tujuan Paket' : 'Pilih Child', disabled: !searchProfileReady }
        if (lookupState === 'existing-multiple-matches') return { label: selectedChildSearchProfile ? 'Review Tujuan Paket' : 'Pilih Hasil Pencarian', disabled: !multipleMatchReady }
        if (accountStatus === 'new' && lookupState === 'new-available') return { label: 'Lanjut Isi Data Parent', disabled: false }
        if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone' || lookupState === 'new-registered') {
          return { label: 'Ikuti Instruksi', disabled: true }
        }

        return { label: accountStatus ? 'Cek Akun Dulu' : 'Pilih Status Akun', disabled: true }
      }

      if (wizardStep === 2 && parentLookupAccount) {
        if (profileTarget === 'existing') return { label: 'Review Tujuan Paket', disabled: !selectedChildProfile }
        if (profileTarget === 'new') return { label: 'Lanjut Isi Child', disabled: false }
        return { label: 'Pilih Profil Tujuan', disabled: true }
      }
      if (wizardStep === 2) return { label: 'Lanjut Isi Data Parent', disabled: contactOwner === null }
      if (wizardStep === 3) return { label: 'Lanjut Isi Child', disabled: !parentDataReady }
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
      return { label: selectedChildSearchProfile ? 'Review' : 'Pilih Child', disabled: !searchProfileReady }
    }
    if (lookupState === 'existing-child-profiles-same-parent' || lookupState === 'existing-child-profiles-cross-parent') {
      return { label: selectedChildSearchProfile ? 'Review' : 'Pilih Child', disabled: !searchProfileReady }
    }
    if (lookupState === 'existing-multiple-matches') {
      return { label: selectedChildSearchProfile ? 'Review' : 'Pilih Hasil Pencarian', disabled: !multipleMatchReady }
    }
    if (parentLookupAccount) {
      return { label: parentProfileTargetReady ? 'Review' : duplicateProfileBlocking ? 'Cek Profil Mirip' : 'Tentukan Profil Tujuan', disabled: !parentProfileTargetReady }
    }
    if (lookupState === 'existing-old-account') {
      if (usesMappingDecision && contactOwner === null) {
        return { label: isOptionThree ? 'Pilih Posisi Data' : 'Pilih Pemilik Kontak', disabled: true }
      }

      return { label: migrationFormReady ? 'Review' : 'Lengkapi Data Migrasi', disabled: !migrationFormReady }
    }
    return { label: 'Pilih Status Akun', disabled: true }
  }, [accountStatus, childDataReady, childProfileFormReady, consent, contactOwner, duplicateProfileBlocking, isOptionThree, lookupState, migrationFormReady, multipleMatchReady, newAccountFormReady, parentDataReady, parentLookupAccount, parentProfileTargetReady, profileTarget, searchProfileReady, selectedChildProfile, selectedChildSearchProfile, usesMappingDecision, wizardStep])

  const disabledReason = (() => {
    if (!cta.disabled || isOptionThree) return null
    if (!accountStatus) return 'Pilih status akun customer'
    if (lookupState === 'idle') return 'Input email, no. HP, atau user serial lalu cek akun'
    if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone' || lookupState === 'new-registered') return 'Ikuti instruksi pada hasil pencarian'
    if (isSearchResolutionLookup(lookupState) && !selectedChildSearchProfile) return 'Pilih Child tujuan paket'
    if (parentUpdateBlocked) return 'Periksa No. HP Parent yang akan diperbarui'
    if (parentLookupAccount && duplicateProfileBlocking) return 'Cek profil mirip sebelum lanjut'
    if (parentLookupAccount && !parentProfileTargetReady) return 'Tentukan Child tujuan paket'
    if (lookupState === 'existing-old-account' && !migrationFormReady) return 'Lengkapi data Parent dan Child'
    if (accountStatus === 'new' && !newAccountFormReady) return 'Lengkapi data Parent dan Child baru'
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
    setConsent(false)
    setPackageIntent(null)
    setDuplicateProfileAcknowledged(false)
    setLookupPickerOpen(false)
    setParentUpdateOpen(false)
    setParentUpdateName('')
    setParentUpdatePhone('')

    if (!phone.trim()) {
      setLookupState('idle')
      return
    }

    if (accountStatus === 'existing') {
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
        setSelectedChildSearchProfileId(singleChildProfileSearchResults[0]?.id ?? '')
        setLookupPickerOpen(true)
        return
      }

      if (isParentAccountWithSingleChildPhone(phone)) {
        setLookupState('existing-parent-single-child')
        setProfileTarget('existing')
        setSelectedChildProfileId(parentAccountWithSingleChild.profiles[0]?.id ?? '')
        return
      }

      if (isParentAccountWithChildrenPhone(phone)) {
        setLookupState('existing-parent-with-children')
        return
      }

      if (isParentAccountWithoutChildrenPhone(phone)) {
        setLookupState('existing-parent-empty')
        setProfileTarget('new')
        return
      }

      if (normalizedPhone === '089900001234' || normalizedPhone.includes('90001234')) {
        setLookupState('existing-not-registered')
        return
      }

      setLookupState('existing-old-account')
      return
    }

    if (isChildProfileContact(phone)) {
      setLookupState('new-available')
      return
    }

    if (
      normalizedPhone.includes('222')
      || isParentAccountWithSingleChildPhone(phone)
      || isParentAccountWithChildrenPhone(phone)
      || isParentAccountWithoutChildrenPhone(phone)
    ) {
      setLookupState('new-registered')
      return
    }

    setLookupState('new-available')
  }

  const handleBottomCtaClick = () => {
    if (!isOptionThree) {
      setReviewOpen(true)
      return
    }

    if (wizardStep === 1) {
      if (searchProfileReady) {
        setWizardStep(5)
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
              parentUpdateOpen={parentUpdateOpen}
              parentUpdatePhone={parentUpdatePhone}
              phone={phone}
              setAccountStatus={handleAccountStatusChange}
              setChildEmail={setChildEmail}
              setConsent={setConsent}
              setChildName={handleChildNameChange}
              setChildPhone={setChildPhone}
              setContactOwner={setContactOwner}
              setGrade={setGrade}
              setParentName={setParentName}
              setParentPhone={setParentPhone}
              setParentUpdateName={setParentUpdateName}
              setParentUpdateOpen={setParentUpdateOpen}
              setParentUpdatePhone={setParentUpdatePhone}
              setPhone={setPhone}
              setProfileTarget={handleProfileTargetChange}
              setSelectedChildProfileId={handleSelectedChildProfileIdChange}
              setSelectedChildSearchProfileId={handleSelectedChildSearchProfileIdChange}
              setDuplicateProfileAcknowledged={setDuplicateProfileAcknowledged}
              setPackageIntent={setPackageIntent}
              setUsesParentIdentity={setUsesParentIdentity}
              showMigrationForm={showMigrationForm}
              showNewAccountForm={showNewAccountForm}
              usesParentIdentity={parentContactSelected}
              wizardStep={wizardStep}
            />
          ) : (
            <PrototypeConceptCard option={prototypeOptions.find((option) => option.id === prototypeOption) ?? prototypeOptions[0]} />
          )}
          {!isOptionThree && invoiceDetailReady && <DiscountCard />}
          {!isOptionThree && invoiceDetailReady && <PaymentDetailCard />}
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
      {compact && <small className="compact-invoice-note">Detail invoice dibuka setelah tujuan paket dipilih.</small>}
      <PriceLine />
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
  lookupState,
  lookupPickerOpen,
  parentName,
  parentPhone,
  parentUpdateName,
  parentUpdateOpen,
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
  setLookupState,
  setLookupPickerOpen,
  setParentName,
  setParentPhone,
  setParentUpdateName,
  setParentUpdateOpen,
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
          lookupState={lookupState}
          lookupPickerOpen={lookupPickerOpen}
          parentName={parentName}
          parentPhone={parentPhone}
          parentUpdateName={parentUpdateName}
          parentUpdateOpen={parentUpdateOpen}
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
          setLookupState={setLookupState}
          setLookupPickerOpen={setLookupPickerOpen}
          setParentName={setParentName}
          setParentPhone={setParentPhone}
          setParentUpdateName={setParentUpdateName}
          setParentUpdateOpen={setParentUpdateOpen}
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
        lookupState={lookupState}
        lookupPickerOpen={lookupPickerOpen}
        selectedChildSearchProfileId={selectedChildSearchProfileId}
        phone={phone}
        setAccountStatus={setAccountStatus}
        contactOwner={contactOwner}
        isBeforeAfterMapping={false}
        isExplicitMapping={isExplicitMapping}
        setContactOwner={setContactOwner}
        setLookupState={setLookupState}
        setLookupPickerOpen={setLookupPickerOpen}
        setPhone={setPhone}
        setProfileTarget={setProfileTarget}
        setSelectedChildProfileId={setSelectedChildProfileId}
        setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
        setPackageIntent={setPackageIntent}
        setUsesParentIdentity={setUsesParentIdentity}
        usesParentIdentity={usesParentIdentity}
      />

      {parentLookupAccount && (
        <StagePanel className="form-stage" step="TAHAP 3" title="Profil Tujuan Aktivasi Paket">
          <ProfileTargetStage
            account={parentLookupAccount}
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            parentUpdateName={parentUpdateName}
            parentUpdateOpen={parentUpdateOpen}
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
            setParentUpdateName={setParentUpdateName}
            setParentUpdateOpen={setParentUpdateOpen}
            setParentUpdatePhone={setParentUpdatePhone}
            setProfileTarget={setProfileTarget}
            setSelectedChildProfileId={setSelectedChildProfileId}
          />
        </StagePanel>
      )}

      {showMigrationForm && (
        <>
          {!isExplicitMapping && (
            <Callout variant="warning">
              <strong>{usesParentIdentity ? 'Kontak akun lama milik orang tua' : 'Kontak akun lama milik anak'}</strong>
              <PointList items={usesParentIdentity ? [
                'No. HP akun lama hanya dipakai untuk mengenali akun saat ini.',
                'Isi ulang Data Parent dan Child sesuai data dari pembeli.',
                'Login anak berubah ke Username dan PIN.',
              ] : [
                'Akun aktif dikonversi menjadi struktur baru.',
                'Isi Data Parent dan Child sesuai data dari pembeli.',
                'Login anak berubah ke Username dan PIN.',
              ]} />
            </Callout>
          )}

          {isExplicitMapping && contactOwner && <MigrationStateSummary contactOwner={contactOwner} phone={phone} />}

          <StagePanel className="form-stage" step="TAHAP 3" title="Lengkapi Data Parent dan Child">
            <AccountForm
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              mode="migration"
              parentName={parentName}
              parentPhone={usesParentIdentity ? phone : parentPhone}
              usesParentIdentity={usesParentIdentity}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
              setParentName={setParentName}
              setParentPhone={setParentPhone}
            />
          </StagePanel>
        </>
      )}

      {showNewAccountForm && (
        <StagePanel className="form-stage" step="TAHAP 3" title="Buat Parent dan Child">
          <AccountForm
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            mode="new"
            parentName={parentName}
            parentPhone={parentPhone || phone}
            usesParentIdentity={false}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
            setParentName={setParentName}
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
  lookupState,
  lookupPickerOpen,
  parentName,
  parentPhone,
  parentUpdateName,
  parentUpdateOpen,
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
  setLookupState,
  setLookupPickerOpen,
  setParentName,
  setParentPhone,
  setParentUpdateName,
  setParentUpdateOpen,
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

  return (
    <>
      <MigrationStageStepper
        accountStatus={accountStatus}
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
          lookupState={lookupState}
          lookupPickerOpen={lookupPickerOpen}
          phone={phone}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setAccountStatus={setAccountStatus}
          setLookupState={setLookupState}
          setLookupPickerOpen={setLookupPickerOpen}
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
              parentUpdateOpen={parentUpdateOpen}
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
              setParentUpdateName={setParentUpdateName}
              setParentUpdateOpen={setParentUpdateOpen}
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
        <StagePanel className="form-stage" step="STEP 3" title={isNewAccount ? 'Buat Parent' : 'Lengkapi Data Parent'}>
          <ParentDataStep
            mode={isNewAccount ? 'new' : 'migration'}
            parentName={parentName}
            parentPhone={usesParentIdentity ? phone : parentPhone}
            setParentName={setParentName}
            setParentPhone={setParentPhone}
            usesParentIdentity={usesParentIdentity}
          />
        </StagePanel>
      )}

      {wizardStep === 4 && (
        <StagePanel className="form-stage" step="STEP 4" title={parentLookupAccount ? 'Buat Child Baru' : 'Lengkapi Child'}>
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
              isMigration={!isNewAccount}
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
            parentName={parentName}
            parentPhone={parentLookupAccount?.phone ?? (usesParentIdentity ? phone : parentPhone)}
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
  lookupState: LookupState
  lookupPickerOpen: boolean
  parentName: string
  parentPhone: string
  parentUpdateName: string
  parentUpdateOpen: boolean
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
  setParentName: (value: string) => void
  setParentPhone: (value: string) => void
  setParentUpdateName: (value: string) => void
  setParentUpdateOpen: (value: boolean) => void
  setParentUpdatePhone: (value: string) => void
  setPhone: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
  setLookupState: (value: LookupState) => void
  setLookupPickerOpen: (value: boolean) => void
  setContactOwner: (value: ContactOwner) => void
  setUsesParentIdentity: (value: boolean) => void
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
  lookupState: LookupState
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  selectedChildSearchProfileId: string
  wizardStep: WizardStep
}

function getDynamicWizardSteps({ accountStatus, lookupState, profileTarget, selectedChildProfileId, selectedChildSearchProfileId }: WizardStepperContext): Array<{ id: WizardStep; label: string }> {
  const hasLookupResult = lookupState !== 'idle'
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const hasSearchProfile = isSearchResolutionLookup(lookupState) && Boolean(selectedChildSearchProfileId)

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
        { id: 4, label: 'Child' },
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
      { id: 4, label: 'Child' },
      { id: 5, label: 'Review' },
    ]
  }

  if (lookupState === 'existing-old-account') {
    return [
      { id: 1, label: 'Cari' },
      { id: 2, label: 'Tujuan' },
      { id: 3, label: 'Ortu' },
      { id: 4, label: 'Child' },
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

function WizardLookupStep({ accountStatus, checkNumber, lookupState, lookupPickerOpen, phone, selectedChildSearchProfileId, setAccountStatus, setLookupState, setLookupPickerOpen, setPhone, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId }: {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  lookupState: LookupState
  lookupPickerOpen: boolean
  phone: string
  selectedChildSearchProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setLookupState: (value: LookupState) => void
  setLookupPickerOpen: (value: boolean) => void
  setPhone: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
}) {
  const isExistingFlow = accountStatus === 'existing'
  const selectedLookupProfile = isSearchResolutionLookup(lookupState)
    ? getChildProfileSearchResults(lookupState).find((profile) => profile.id === selectedChildSearchProfileId)
    : undefined

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
              placeholder="Email / No. HP / User serial"
              onChange={(event) => setPhone(event.target.value)}
              aria-label={isExistingFlow ? 'Email, no. HP, atau user serial akun aktif Ruangguru' : 'Nomor HP orang tua'}
            />
            <button type="button" onClick={checkNumber}>Cek Akun</button>
          </div>

          {lookupState === 'idle' && (
            <Callout className="lookup-hint">
              <strong>Arahan untuk Agent</strong>
              <p>{isExistingFlow ? 'Input email, no. HP, atau user serial akun aktif Ruangguru saat ini.' : 'Input No. HP orang tua yang akan menjadi Master Account.'}</p>
            </Callout>
          )}
          {lookupState === 'existing-old-account' && (
            <AccountResult
              name={existingAccount.name}
              phone={phone}
              serial={existingAccount.serial}
              statusLabel="Akun aktif ditemukan"
              description="Lanjutkan ke tahap mapping."
            />
          )}
          {isParentProfileLookup(lookupState) && <ParentAccountResult account={getLookupParentAccount(lookupState)!} />}
          {isSearchResolutionLookup(lookupState) && (
            <>
              {!selectedLookupProfile && (
                <LookupPickerTrigger
                  lookupState={lookupState}
                  selectedChildSearchProfileId={selectedChildSearchProfileId}
                  onOpen={() => setLookupPickerOpen(true)}
                />
              )}
              {selectedLookupProfile && (
                <div className="lookup-main-review">
                  <SelectedTargetSummary
                    actionLabel="Ubah"
                    onAction={() => setLookupPickerOpen(true)}
                    parentName={selectedLookupProfile.parentName ?? 'Parent'}
                    parentPhone={selectedLookupProfile.parentPhone ?? '-'}
                    parentSerial={selectedLookupProfile.parentSerial}
                    profile={selectedLookupProfile}
                  />
                </div>
              )}
            </>
          )}
          {lookupState === 'existing-not-registered' && <ExistingNotRegistered setAccountStatus={setAccountStatus} />}
          {lookupState === 'existing-child-phone' && <ExistingChildPhone setAccountStatus={setAccountStatus} />}
          {lookupState === 'new-available' && <NewAvailableAccount isChildContact={isChildProfileContact(phone)} phone={phone} />}
          {lookupState === 'new-registered' && <NewRegisteredAccount phone={phone} setAccountStatus={setAccountStatus} />}
        </div>
      )}
      {isSearchResolutionLookup(lookupState) && lookupPickerOpen && (
        <LookupPickerSheet
          lookupState={lookupState}
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

function ParentDataStep({ mode, parentName, parentPhone, setParentName, setParentPhone, usesParentIdentity }: {
  mode: 'migration' | 'new'
  parentName: string
  parentPhone: string
  setParentName: (value: string) => void
  setParentPhone: (value: string) => void
  usesParentIdentity: boolean
}) {
  const shouldCheckParentPhone = mode === 'migration' && !usesParentIdentity
  const parentPhoneAccount = shouldCheckParentPhone ? getRegisteredParentAccount(parentPhone) : null
  const parentPhoneIsCheckable = shouldCheckParentPhone && canCheckParentPhone(parentPhone)
  const shouldLockParentName = Boolean(parentPhoneAccount)
  const parentNameValue = parentPhoneAccount?.name ?? parentName

  return (
    <div className="form-fields compact-form">
      <TextField
        helper={usesParentIdentity ? 'Nomor ini dikunci dari akun lama. Data lain tetap diisi sesuai informasi pembeli.' : undefined}
        label="No. HP Parent"
        placeholder="Masukan no. HP orang tua"
        readOnly={usesParentIdentity}
        value={parentPhone}
        onChange={setParentPhone}
      />
      {shouldCheckParentPhone && parentPhoneIsCheckable && (
        <ParentPhoneCheckResult account={parentPhoneAccount} phone={parentPhone} />
      )}
      <TextField
        helper={shouldLockParentName ? 'Dikunci dari akun yang ditemukan melalui No. HP Parent.' : undefined}
        label="Nama Parent"
        placeholder="Masukan nama lengkap orang tua"
        readOnly={shouldLockParentName}
        value={parentNameValue}
        onChange={setParentName}
      />
    </div>
  )
}

function ChildProfileStep({ childEmail, childName, childPhone, grade, isMigration, setChildEmail, setChildName, setChildPhone, setGrade }: {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  isMigration: boolean
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
}) {
  return (
    <div className="form-fields compact-form">
      <TextField label="Nama Lengkap Child" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak, bukan akses login utama. Nomor boleh sama dengan milik orang tua."
        label="No. HP Child"
        placeholder="Masukan no. HP anak (opsional)"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak, bukan akses login utama. Email boleh sama dengan milik orang tua."
        label="Email Child"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout className="strong">
        <strong>Yang perlu diberitahu</strong>
        <PointList items={[
          isMigration ? 'Data Child diisi sesuai informasi dari pembeli.' : 'Child baru dibuat di bawah Parent.',
          <>No. HP dan Email anak <strong>tidak bisa digunakan login</strong>.</>,
          'Username dan PIN dikirim ke WhatsApp Parent setelah transaksi berhasil.',
        ]} />
      </Callout>
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
      <TextField label="Nama Lengkap Child" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak. Nomor boleh sama dengan milik orang tua."
        label="No. HP Child"
        placeholder="Masukan no. HP anak (opsional)"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak dan tidak bisa digunakan login."
        label="Email Child"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout>
        <strong>Setelah transaksi berhasil</strong>
        <PointList items={[
          'Child baru dibuat di bawah Parent yang ditemukan.',
          'Username dan PIN anak dikirim ke WhatsApp Parent.',
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
  const parentDisplayName = selectedSearchProfile?.parentName ?? (parentName || parentAccount?.name || parentLabel)
  const parentDisplayPhone = selectedSearchProfile?.parentPhone ?? (parentPhone || parentAccount?.phone || parentNumberLabel)
  const targetProfileName = selectedSearchProfile
    ? selectedSearchProfile.name
    : parentAccount
    ? profileTarget === 'existing' && selectedProfile
      ? selectedProfile.name
      : childName || 'Child baru'
    : isNewAccount || usesParentIdentity
      ? childName || 'Child baru'
      : existingAccount.name
  const targetGrade = selectedSearchProfile?.grade ?? (parentAccount && profileTarget === 'existing' && selectedProfile ? selectedProfile.grade : grade || '-')
  const usesExistingProfile = Boolean(selectedSearchProfile || (parentAccount && profileTarget === 'existing' && selectedProfile))
  const reviewType = selectedSearchProfile || parentAccount ? 'Aktivasi paket' : isNewAccount ? 'Pembuatan akun' : 'Konversi akun'
  const reviewNote = selectedSearchProfile
    ? 'Paket akan aktif di Child yang ditemukan. Akses profil tidak berubah.'
    : parentAccount
    ? usesExistingProfile
      ? 'Paket akan aktif di profil yang dipilih. Akses profil tidak berubah.'
      : 'Profil baru akan dibuat sebelum paket diaktifkan.'
    : isNewAccount
      ? 'Struktur Parent dan Child baru akan dibuat.'
      : 'Akun aktif akan disesuaikan ke struktur baru.'
  const accessValue = usesExistingProfile ? 'Tidak berubah' : 'Username + PIN'
  const accessCopy = usesExistingProfile ? 'Gunakan akses profil yang sudah ada.' : parentAccount || isNewAccount ? 'Username dan PIN dikirim ke WhatsApp Parent.' : 'Login anak berubah ke Username dan PIN.'
  const consentCopy = usesExistingProfile ? 'Child dan Parent tujuan paket sudah dikonfirmasi ke customer.' : 'Perubahan akses login dan pemrosesan data sudah dijelaskan ke customer.'
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
        note={reviewNote}
        parentName={parentDisplayName}
        parentPhone={parentDisplayPhone}
        parentSerial={selectedSearchProfile?.parentSerial ?? parentAccount?.serial}
        profile={reviewProfile}
        typeLabel={reviewType}
      />

      <section className="review-access-card" aria-label="Akses Child">
        <span>Akses Child</span>
        <strong>{accessValue}</strong>
        <p>{accessCopy}</p>
      </section>

      <section className="review-checklist" aria-label="Yang perlu dipastikan">
        <h4>Pastikan sebelum lanjut</h4>
        <ReviewCheckItem>Profil tujuan paket sudah sesuai dengan customer.</ReviewCheckItem>
        {usesExistingProfile ? <ReviewCheckItem>Akses profil anak tetap mengikuti pengaturan yang sudah ada.</ReviewCheckItem> : <ReviewCheckItem>No. HP/email anak hanya tersimpan sebagai data profil.</ReviewCheckItem>}
      </section>

      <label className="consent-row review-consent">
        <input checked={consent} type="checkbox" onChange={(event) => setConsent(event.target.checked)} />
        <span>{consentCopy}</span>
      </label>
    </div>
  )
}

function ReviewTargetCard({ note, parentName, parentPhone, parentSerial, profile, typeLabel }: { note: string; parentName: string; parentPhone: string; parentSerial?: string; profile: ChildProfile; typeLabel: string }) {
  return (
    <section className="search-target-card selected review-target-card" aria-label="Ringkasan tujuan paket">
      <div className="search-target-head">
        <div>
          <span className="summary-kicker">{typeLabel}</span>
          <strong>Profil tujuan paket</strong>
          <small>{note}</small>
        </div>
      </div>
      <div className="search-target-selected">
        <div className="selected-entity child">
          <div className="entity-heading">
            <span>Child</span>
            <strong>{profile.name}</strong>
          </div>
          <div className="entity-meta-row">
            <small>{profile.grade}</small>
            <UserSerial value={profile.serial} />
          </div>
          <ActivePackageLines profile={profile} />
        </div>
        <div className="selected-entity parent">
          <div className="entity-heading">
            <span>Parent</span>
            <strong>{parentName}</strong>
          </div>
          <div className="entity-meta-row">
            {parentPhone && <small>{parentPhone}</small>}
            <UserSerial value={parentSerial} />
          </div>
        </div>
      </div>
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

function ParentAccountResult({ account }: { account: ParentProfileAccount }) {
  const hasProfiles = account.profiles.length > 0
  const hasActivePackage = account.profiles.some((profile) => profile.hasActivePackage)

  return (
    <div className="search-resolution parent-lookup-result">
      <div className="resolution-group">
        <span className="resolution-label">Akun cocok</span>
        <ParentAccountCard account={account} variant="success" />
      </div>
      <Callout variant={hasActivePackage ? 'warning' : 'info'}>
        <strong>Aksi Agent</strong>
        <PointList items={hasProfiles ? [
          'Konfirmasi nama Child yang akan menerima paket.',
          'Jika Child belum ada di daftar, pilih Buat Profil Baru di tahap berikutnya.',
          hasActivePackage ? 'Jika Child punya paket aktif, pastikan paket baru memang untuk Child yang sama.' : 'Lanjutkan jika Child tujuan sudah benar.',
        ] : [
          'Minta nama, No. HP, email, dan kelas Child dari customer.',
          'Buat Child baru di bawah akun Parent ini.',
        ]} />
      </Callout>
    </div>
  )
}
function LookupPickerTrigger({ lookupState, onOpen, selectedChildSearchProfileId }: { lookupState: LookupState; onOpen: () => void; selectedChildSearchProfileId: string }) {
  const profileResults = getChildProfileSearchResults(lookupState)
  const parentCount = getChildProfileParentCount(profileResults)
  const selectedProfile = profileResults.find((profile) => profile.id === selectedChildSearchProfileId)

  return (
    <SearchTargetCard
      actionLabel={selectedProfile ? 'Ubah' : 'Lihat'}
      childCount={profileResults.length}
      parentCount={parentCount}
      profile={selectedProfile}
      onAction={onOpen}
    />
  )
}

function LookupPickerSheet({ lookupState, selectedChildSearchProfileId, setLookupState, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId, onClose }: {
  lookupState: LookupState
  selectedChildSearchProfileId: string
  setLookupState: (value: LookupState) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
  onClose: () => void
}) {
  return (
    <BottomSheet className="lookup-picker-sheet" title="Pilih Profil Tujuan Paket" onClose={onClose}>
      <SearchResolutionResults
        lookupState={lookupState}
        selectedChildSearchProfileId={selectedChildSearchProfileId}
        setLookupState={setLookupState}
        setPackageIntent={setPackageIntent}
        setProfileTarget={setProfileTarget}
        setSelectedChildProfileId={setSelectedChildProfileId}
        setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
      />
      <button className="sheet-primary" disabled={!selectedChildSearchProfileId} type="button" onClick={onClose}>Pilih Profil</button>
    </BottomSheet>
  )
}


function SearchResolutionResults({ lookupState, selectedChildSearchProfileId, setLookupState, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId }: {
  lookupState: LookupState
  selectedChildSearchProfileId: string
  setLookupState: (value: LookupState) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
}) {
  const profileResults = getChildProfileSearchResults(lookupState)
  const parentCount = getChildProfileParentCount(profileResults)
  const hasParentAccountResult = lookupState === 'existing-multiple-matches'
  const hasMultipleProfiles = profileResults.length > 1
  const shouldGroupByParent = profileResults.length > 0
  const isSameParentRelationMatch = hasParentAccountResult
    && parentCount === 1
    && profileResults.every((profile) => profile.parentPhone === parentAccountWithChildren.phone)
  const showSeparateParentResult = hasParentAccountResult && !isSameParentRelationMatch
  const parentGroups = profileResults.reduce<Array<{ name: string; phone: string; serial?: string; profiles: ChildProfile[] }>>((groups, profile) => {
    const parentPhoneKey = profile.parentPhone ?? 'unknown'
    const existingGroup = groups.find((group) => group.phone === parentPhoneKey)

    if (existingGroup) {
      existingGroup.profiles.push(profile)
      return groups
    }

    return [...groups, { name: profile.parentName ?? 'Parent', phone: parentPhoneKey, serial: profile.parentSerial, profiles: [profile] }]
  }, [])

  const resolutionCopy = (() => {
    if (lookupState === 'existing-multiple-matches') {
      if (isSameParentRelationMatch) {
        return {
          title: 'Data ditemukan dalam 1 relasi Parent',
          description: 'Input ini milik Parent dan juga dipakai oleh Child di bawah Parent yang sama. Pilih Child tujuan paket.',
          variant: 'success' as CalloutVariant,
        }
      }

      return {
        title: 'Data ditemukan di beberapa relasi',
        description: 'Input ini terdaftar sebagai Parent dan juga dipakai di Child. Pilih tujuan pembelian paket yang benar.',
        variant: 'warning' as CalloutVariant,
      }
    }

    if (lookupState === 'existing-child-profiles-same-parent') {
      return {
        title: 'Beberapa Child ditemukan',
        description: 'Data ini dipakai oleh beberapa Child di 1 Parent. Pilih Child yang akan menerima paket.',
        variant: 'warning' as CalloutVariant,
      }
    }

    if (lookupState === 'existing-child-profiles-cross-parent') {
      return {
        title: 'Data terhubung ke beberapa Parent',
        description: 'Konfirmasi nama anak dan nama orang tua sebelum memilih tujuan paket.',
        variant: 'warning' as CalloutVariant,
      }
    }

    return {
      title: 'Child ditemukan',
      description: 'Data yang dimasukkan terhubung ke Child. Child bukan akun login, tapi bisa menjadi tujuan aktivasi paket.',
      variant: 'success' as CalloutVariant,
    }
  })()

  const selectParentAccount = () => {
    setLookupState('existing-parent-with-children')
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setPackageIntent(null)
  }

  const selectChildProfile = (profile: ChildProfile) => {
    setProfileTarget('existing')
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId(profile.id)
    setPackageIntent(null)
  }

  return (
    <div className="search-resolution">
      <Callout icon={<Info size={16} />} variant={resolutionCopy.variant}>
        <strong>{resolutionCopy.title}</strong>
        <p>{resolutionCopy.description}</p>
      </Callout>

      {showSeparateParentResult && (
        <div className="resolution-group">
          <span className="resolution-label">Akun cocok</span>
          <ParentAccountCard account={parentAccountWithChildren} onClick={selectParentAccount} />
        </div>
      )}

      <div className="resolution-group result-list-shell">
        <span className="resolution-label">{parentCount > 1 ? 'Pilih profil Child dari Parent yang benar' : hasMultipleProfiles ? 'Pilih Child' : 'Child'}</span>
        <div className={shouldGroupByParent ? 'resolution-profile-groups grouped' : 'resolution-profile-groups'}>
          {parentGroups.map((group) => (
            <div className={shouldGroupByParent ? 'resolution-parent-bucket grouped' : 'resolution-parent-bucket'} key={group.phone}>
              {shouldGroupByParent && <ParentBucketHeading name={group.name} phone={group.phone} serial={group.serial} />}
              {group.profiles.map((profile) => (
                <ChildTargetCandidateCard
                  active={selectedChildSearchProfileId === profile.id}
                  key={profile.id}
                  profile={profile}
                  onClick={() => selectChildProfile(profile)}
                  hideParentDetail={shouldGroupByParent}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <Callout>
        <strong>Arahan untuk Agent</strong>
        <PointList items={isSameParentRelationMatch ? [
          'Akun Parent hanya menjadi wadah relasi, bukan pilihan tujuan paket.',
          'Pilih tepat 1 Child yang akan menerima paket.',
          'No. HP/email yang sama boleh muncul di beberapa Child karena data profil tidak dipakai untuk login.',
        ] : lookupState === 'existing-child-profiles-cross-parent' ? [
          'Tanyakan ulang nama anak dan nama orang tua sebelum memilih.',
          'Pilih tepat 1 Child sebagai tujuan aktivasi paket.',
          'No. HP/email di Child bukan akses login, jadi boleh muncul di beberapa profil.',
        ] : lookupState === 'existing-child-profiles-same-parent' ? [
          'Konfirmasi anak yang akan menerima paket karena ada beberapa Child dalam akun yang sama.',
          'Pilih tepat 1 Child sebelum lanjut review.',
          'No. HP/email profil anak tidak unik dan tidak dipakai untuk login.',
        ] : [
          'Konfirmasi dulu apakah pembelian paket untuk akun orang tua atau salah satu Child.',
          'No. HP/email yang sama boleh muncul di Child karena data profil tidak dipakai untuk login.',
          'Jika memilih Child, lanjut review tujuan paket tanpa membuat akun baru.',
        ]} />
      </Callout>
    </div>
  )
}
function ProfileTargetStage({ account, childEmail, childName, childPhone, duplicateProfileAcknowledged, duplicateProfileMatches, grade, parentUpdateName, parentUpdateOpen, parentUpdatePhone, profileTarget, selectedChildProfileId, setChildEmail, setChildName, setChildPhone, setDuplicateProfileAcknowledged, setGrade, setPackageIntent, setParentUpdateName, setParentUpdateOpen, setParentUpdatePhone, setProfileTarget, setSelectedChildProfileId }: {
  account: ParentProfileAccount
  childEmail: string
  childName: string
  childPhone: string
  duplicateProfileAcknowledged: boolean
  duplicateProfileMatches: ChildProfile[]
  grade: string
  parentUpdateName: string
  parentUpdateOpen: boolean
  parentUpdatePhone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setDuplicateProfileAcknowledged: (value: boolean) => void
  setGrade: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setParentUpdateName: (value: string) => void
  setParentUpdateOpen: (value: boolean) => void
  setParentUpdatePhone: (value: string) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
}) {
  const selectedProfile = account.profiles.find((profile) => profile.id === selectedChildProfileId)
  const hasProfiles = account.profiles.length > 0
  const parentUpdateState = getParentUpdateState(account, parentUpdateName, parentUpdatePhone)
  const parentDisplayName = parentUpdateState.nextName
  const parentDisplayPhone = parentUpdateState.nextPhone

  const openParentUpdate = () => {
    if (!parentUpdateName.trim()) setParentUpdateName(account.name)
    if (!parentUpdatePhone.trim()) setParentUpdatePhone(account.phone)
    setParentUpdateOpen(true)
  }

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
      <div className="target-stage-brief">
        <strong>{hasProfiles ? 'Pilih Child tujuan paket' : 'Buat Child untuk aktivasi paket'}</strong>
        <p>{hasProfiles ? 'Gunakan daftar di bawah untuk memilih Child yang disebut customer.' : 'Akun Parent ini belum punya Child. Lengkapi data Child baru dari customer.'}</p>
      </div>

      <div className="resolution-group result-list-shell parent-profile-selection">
        <span className="resolution-label">{hasProfiles ? 'Child dalam akun Parent ini' : 'Akun Parent'}</span>
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
          <strong>Child ini sudah punya paket aktif</strong>
          <PointList items={[
            'Pastikan paket baru memang akan diaktifkan untuk Child ini.',
            'Jika bukan untuk Child ini, pilih Child lain atau buat Profil Baru.',
          ]} />
        </Callout>
      )}

      {profileTarget === 'existing' && selectedProfile && (
        <>
          <SelectedTargetSummary
            parentName={parentDisplayName}
            parentPhone={parentDisplayPhone}
            parentSerial={account.serial}
            profile={selectedProfile}
          />
          <ParentUpdatePanel
            account={account}
            open={parentUpdateOpen}
            parentName={parentUpdateName || account.name}
            parentPhone={parentUpdatePhone || account.phone}
            updateState={parentUpdateState}
            setOpen={setParentUpdateOpen}
            setParentName={setParentUpdateName}
            setParentPhone={setParentUpdatePhone}
            onOpen={openParentUpdate}
          />
        </>
      )}

      {profileTarget === 'new' && (
        <div className="new-profile-inline">
          <h4>Data Child Baru</h4>
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

function ParentUpdatePanel({ account, onOpen, open, parentName, parentPhone, setOpen, setParentName, setParentPhone, updateState }: {
  account: ParentProfileAccount
  onOpen: () => void
  open: boolean
  parentName: string
  parentPhone: string
  setOpen: (value: boolean) => void
  setParentName: (value: string) => void
  setParentPhone: (value: string) => void
  updateState: ReturnType<typeof getParentUpdateState>
}) {
  const hasValidPhoneLength = canCheckParentPhone(parentPhone)

  if (!open && updateState.changed) {
    return (
      <div className="parent-update-summary">
        <div>
          <strong>Data Parent akan diperbarui</strong>
          <small>{account.name} · {account.phone}</small>
          <small>Menjadi {updateState.nextName} · {updateState.nextPhone}</small>
        </div>
        <button className="inline-action" type="button" onClick={onOpen}>Ubah lagi</button>
      </div>
    )
  }

  if (!open) {
    return (
      <button className="inline-action parent-update-trigger" type="button" onClick={onOpen}>Ubah data Parent</button>
    )
  }

  return (
    <div className="parent-update-panel">
      <div className="parent-update-head">
        <div>
          <strong>Update Data Parent</strong>
          <small>Gunakan jika customer menyampaikan data Parent berubah saat pembelian.</small>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Tutup update data Parent"><X size={14} /></button>
      </div>
      <div className="form-fields compact-form">
        <TextField label="Nama Parent" placeholder="Masukan nama Parent" value={parentName} onChange={setParentName} />
        <TextField label="No. HP Parent" placeholder="Masukan No. HP Parent terbaru" value={parentPhone} onChange={setParentPhone} />
      </div>
      {updateState.registeredToOtherParent ? (
        <Callout variant="danger">
          <strong>Nomor sudah dipakai Parent lain</strong>
          <PointList items={[
            <>Nomor ini melekat ke akun <strong>{updateState.registeredAccount?.name}</strong>.</>,
            'Jangan update sebelum customer mengonfirmasi akun Parent yang benar.',
          ]} />
        </Callout>
      ) : updateState.isChildContact ? (
        <Callout variant="info">
          <strong>Nomor sama dengan kontak Child</strong>
          <p>Ini boleh dilanjutkan karena No. HP Child hanya data profil dan bukan akun login.</p>
        </Callout>
      ) : updateState.changed && !hasValidPhoneLength ? (
        <Callout variant="warning">
          <strong>No. HP Parent belum lengkap</strong>
          <p>Masukkan minimal 8 digit agar perubahan bisa dilanjutkan ke review.</p>
        </Callout>
      ) : updateState.changed ? (
        <Callout variant="success">
          <strong>Data Parent akan diperbarui</strong>
          <p>Perubahan ini akan dibawa ke review dan diproses bersama transaksi.</p>
        </Callout>
      ) : (
        <Callout>
          <strong>Belum ada perubahan</strong>
          <p>Ubah nama atau No. HP Parent jika customer memberikan data baru.</p>
        </Callout>
      )}

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
        <div className="candidate-meta"><span className="identity-badge parent">Parent</span><UserSerial value={serial} /></div>
      </div>
    </div>
  )
}

function ParentAccountCard({ account, active = false, onClick, variant = 'default' }: { account: ParentProfileAccount; active?: boolean; onClick?: () => void; variant?: 'default' | 'success' }) {
  const className = [
    'structure-target resolver-stack-card single parent-result',
    active ? 'active' : '',
    variant === 'success' ? 'success' : '',
  ].filter(Boolean).join(' ')
  const profileCopy = account.profiles.length > 0 ? `${account.profiles.length} Child tersedia` : 'Belum ada Child'
  const guidanceCopy = account.profiles.length > 0
    ? 'Pilih Child tujuan paket di tahap berikutnya.'
    : 'Buat Child baru sebelum paket diaktifkan.'
  const content = (
    <div className="candidate-section parent-section">
      <span className="identity-avatar parent" aria-hidden="true" />
      <div className="identity-copy">
        {variant === 'success' && <span className="parent-card-status"><CheckCircle2 size={14} /> Parent ditemukan</span>}
        <div className="candidate-heading">
          <strong className="candidate-name parent-name">{account.name}</strong>
          <span>{account.phone}</span>
        </div>
        <div className="candidate-meta"><span className="identity-badge parent">Parent</span><UserSerial value={account.serial} /></div>
        <small>{variant === 'success' ? `${profileCopy}. ${guidanceCopy}` : profileCopy}</small>
      </div>
    </div>
  )

  if (onClick) {
    return <button className={className} type="button" onClick={onClick}>{content}</button>
  }

  return <div className={`${className} parent-account-preview`}>{content}</div>
}
function ChildTargetCandidateCard({ active, hideParentDetail = false, onClick, profile }: { active: boolean; hideParentDetail?: boolean; onClick: () => void; profile: ChildProfile }) {
  return (
    <button
      className={active ? 'structure-target resolver-stack-card child-result active' : 'structure-target resolver-stack-card child-result'}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      {!hideParentDetail && (
        <div className="candidate-parent-inline">
          <div className="candidate-heading">
            <strong className="candidate-name parent-name">{profile.parentName}</strong>
            {profile.parentPhone && <span>{profile.parentPhone}</span>}
          </div>
          <div className="candidate-meta"><span className="identity-badge parent">Parent</span><UserSerial value={profile.parentSerial} /></div>
        </div>
      )}
      <div className="candidate-section child-section">
        <span className="identity-avatar child" aria-hidden="true" />
        <div className="identity-copy">
          <div className="candidate-heading">
            <strong className="candidate-name">{profile.name}</strong>
            {profile.contact && <span>{profile.contact}</span>}
          </div>
          <div className="candidate-meta">
            <span className="identity-badge child">Child</span>
            <UserSerial value={profile.serial} />
          </div>
          <small className="grade-line">{profile.grade}</small>
          <ActivePackageLines profile={profile} />
        </div>
      </div>
    </button>
  )
}

function NewChildTargetCard({ active, hasProfiles, onClick }: { active: boolean; hasProfiles: boolean; onClick: () => void }) {
  return (
    <button
      className={active ? 'structure-target resolver-stack-card child-result new-child-target active' : 'structure-target resolver-stack-card child-result new-child-target'}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <div className="candidate-section child-section">
        <span className="identity-avatar new-child" aria-hidden="true"><Plus size={16} /></span>
        <div className="identity-copy">
          <div className="candidate-heading">
            <strong className="candidate-name">Buat Child Baru</strong>
          </div>
          <div className="candidate-meta">
            <span className="identity-badge child">Child</span>
          </div>
          <small className="grade-line">{hasProfiles ? 'Gunakan jika Child belum ada di daftar.' : 'Wajib dibuat sebelum paket diaktifkan.'}</small>
        </div>
      </div>
    </button>
  )
}
function SearchTargetCard({ actionLabel, childCount, parentCount, profile, onAction }: {
  actionLabel: string
  childCount: number
  parentCount: number
  profile?: ChildProfile
  onAction: () => void
}) {
  return (
    <div className={profile ? 'search-target-card selected' : 'search-target-card'}>
      <div className="search-target-head">
        <div>
          <span className="summary-kicker">Hasil pencarian</span>
          <strong>{profile ? 'Profil terpilih' : 'Pilih profil tujuan'}</strong>
          <small>{parentCount} Parent · {childCount} Child</small>
          {!profile && <small>Pilih profil tujuan paket dari daftar hasil.</small>}
        </div>
        <button type="button" onClick={onAction}>{actionLabel}</button>
      </div>
      {profile && (
        <div className="search-target-selected">
          <div className="selected-entity child">
            <div className="entity-heading">
              <span>Child</span>
              <strong>{profile.name}</strong>
            </div>
            <div className="entity-meta-row">
              <small>{profile.grade}</small>
              <UserSerial value={profile.serial} />
            </div>
            <ActivePackageLines profile={profile} />
          </div>
          <div className="selected-entity parent">
            <div className="entity-heading">
              <span>Parent</span>
              <strong>{profile.parentName ?? 'Parent'}</strong>
            </div>
            <div className="entity-meta-row">
              {profile.parentPhone && <small>{profile.parentPhone}</small>}
              <UserSerial value={profile.parentSerial} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SelectedTargetSummary({ actionLabel = 'Ubah', onAction, parentName, parentPhone, parentSerial, profile }: { actionLabel?: string; onAction?: () => void; parentName: string; parentPhone: string; parentSerial?: string; profile: ChildProfile }) {
  return (
    <div className="selected-target-wrapper" aria-label="Profil tujuan paket terpilih">
      <SearchTargetCard
        actionLabel={actionLabel}
        childCount={1}
        parentCount={1}
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
        acknowledged ? 'Agent memilih tetap membuat Child baru.' : 'Pilih profil yang benar atau konfirmasi tetap buat profil baru.',
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
  lookupState,
  lookupPickerOpen,
  phone,
  setAccountStatus,
  setContactOwner,
  selectedChildSearchProfileId,
  setLookupState,
  setLookupPickerOpen,
  setPhone,
  setPackageIntent,
  setProfileTarget,
  setSelectedChildProfileId,
  setSelectedChildSearchProfileId,
  setUsesParentIdentity,
  usesParentIdentity,
}: {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  phone: string
  selectedChildSearchProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setContactOwner: (value: ContactOwner) => void
  setLookupState: (value: LookupState) => void
  setLookupPickerOpen: (value: boolean) => void
  setPhone: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
  setUsesParentIdentity: (value: boolean) => void
  usesParentIdentity: boolean
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
  const title = isExistingFlow ? 'Cari Akun Ruangguru Aktif Saat Ini' : 'Masukkan no. HP Parent'
  const selectedLookupProfile = isSearchResolutionLookup(lookupState)
    ? getChildProfileSearchResults(lookupState).find((profile) => profile.id === selectedChildSearchProfileId)
    : undefined

  return (
    <StagePanel className="divided" step="TAHAP 2" title={title}>
      <div className="lookup-row">
        <input
          value={phone}
          placeholder="Email / No. HP / User serial"
          onChange={(event) => setPhone(event.target.value)}
          aria-label={isExistingFlow ? 'Email, no. HP, atau user serial akun aktif Ruangguru' : 'Nomor HP orang tua'}
        />
        <button type="button" onClick={checkNumber}>Cek Akun</button>
      </div>
      {lookupState === 'idle' && (
        <Callout className="lookup-hint">
          <strong>Arahan untuk Agent</strong>
          <p>{isExistingFlow ? 'Input email, no. HP, atau user serial akun aktif Ruangguru saat ini.' : 'Input nomor orang tua yang akan menjadi Master Account. Sistem akan memastikan nomor ini belum terdaftar sebagai akun.'}</p>
        </Callout>
      )}
      {lookupState === 'existing-old-account' && (
        <FoundAccount
          contactOwner={contactOwner}
          isBeforeAfterMapping={isBeforeAfterMapping}
          isExplicitMapping={isExplicitMapping}
          phone={phone}
          setContactOwner={setContactOwner}
          setUsesParentIdentity={setUsesParentIdentity}
          usesParentIdentity={usesParentIdentity}
        />
      )}
      {isParentProfileLookup(lookupState) && <ParentAccountResult account={getLookupParentAccount(lookupState)!} />}
      {isSearchResolutionLookup(lookupState) && (
        <>
          {!selectedLookupProfile && (
            <LookupPickerTrigger
              lookupState={lookupState}
              selectedChildSearchProfileId={selectedChildSearchProfileId}
              onOpen={() => setLookupPickerOpen(true)}
            />
          )}
          {selectedLookupProfile && (
            <div className="lookup-main-review">
              <SelectedTargetSummary
                actionLabel="Ubah"
                onAction={() => setLookupPickerOpen(true)}
                parentName={selectedLookupProfile.parentName ?? 'Parent'}
                parentPhone={selectedLookupProfile.parentPhone ?? '-'}
                parentSerial={selectedLookupProfile.parentSerial}
                profile={selectedLookupProfile}
              />
            </div>
          )}
        </>
      )}
      {lookupState === 'existing-not-registered' && <ExistingNotRegistered setAccountStatus={setAccountStatus} />}
      {lookupState === 'existing-child-phone' && <ExistingChildPhone setAccountStatus={setAccountStatus} />}
      {lookupState === 'new-available' && <NewAvailableAccount isChildContact={isChildProfileContact(phone)} phone={phone} />}
      {lookupState === 'new-registered' && <NewRegisteredAccount phone={phone} setAccountStatus={setAccountStatus} />}
      {isSearchResolutionLookup(lookupState) && lookupPickerOpen && (
        <LookupPickerSheet
          lookupState={lookupState}
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

function FoundAccount({
  contactOwner,
  isBeforeAfterMapping,
  isExplicitMapping,
  phone,
  setContactOwner,
  setUsesParentIdentity,
  usesParentIdentity,
}: {
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  phone: string
  setContactOwner: (value: ContactOwner) => void
  setUsesParentIdentity: (value: boolean) => void
  usesParentIdentity: boolean
}) {
  if (isBeforeAfterMapping) {
    return <BeforeAfterMappingPanel contactOwner={contactOwner} phone={phone} setContactOwner={setContactOwner} />
  }

  if (isExplicitMapping) {
    return (
      <>
        <AccountResult
          name={existingAccount.name}
          phone={phone}
          serial={existingAccount.serial}
          statusLabel="Akun ditemukan"
          description="Tentukan kontak akun lama masuk ke data siapa."
        />
        <div className="mapping-decision">
          <h3 className="small-title">Kontak akun lama dipakai untuk</h3>
          <div className="segmented-control" role="radiogroup" aria-label="Kontak akun lama dipakai untuk">
            <button
              className={contactOwner === 'child' ? 'segment-button active' : 'segment-button'}
              type="button"
              aria-pressed={contactOwner === 'child'}
              onClick={() => setContactOwner('child')}
            >
              <span>Child</span>
              <small>Isi data manual</small>
            </button>
            <button
              className={contactOwner === 'parent' ? 'segment-button active' : 'segment-button'}
              type="button"
              aria-pressed={contactOwner === 'parent'}
              onClick={() => setContactOwner('parent')}
            >
              <span>Data Parent</span>
              <small>Isi data manual</small>
            </button>
          </div>
        </div>
        <Callout variant={contactOwner === 'parent' ? 'warning' : 'info'}>
          <strong>{contactOwner ? 'Dampak pilihan' : 'Aksi berikutnya'}</strong>
          <PointList items={contactOwner === 'parent' ? [
            'No. HP akun lama hanya dipakai untuk mengenali akun saat ini.',
            'Isi Data Parent dan Child sesuai data dari pembeli.',
            'Pilihan ini tidak berarti akun lama digunakan oleh orang tua.',
          ] : contactOwner === 'child' ? [
            'Data akun lama tidak otomatis mengisi Child.',
            'Isi Data Parent dan Child sesuai data dari pembeli.',
            'Child tetap tidak bisa login dengan No. HP/email.',
          ] : [
            'Pilih Child jika No. HP/email akun lama adalah milik siswa.',
            'Pilih Data Parent jika No. HP/email akun lama adalah milik orang tua.',
          ]} />
        </Callout>
      </>
    )
  }

  return (
    <>
      <AccountResult
        name={existingAccount.name}
        phone={phone}
        serial={existingAccount.serial}
        statusLabel="Akun ditemukan"
        description="Tentukan apakah No. HP/email akun lama adalah informasi orang tua."
      />
      <ToggleRow checked={usesParentIdentity} label="Akun ini menggunakan No. HP atau email orang tua" onClick={() => setUsesParentIdentity(!usesParentIdentity)} />
      {usesParentIdentity && (
        <Callout variant="warning">
          <strong>Konsekuensi toggle aktif</strong>
          <PointList items={[
            'No. HP/email akun ' + existingAccount.name + ' dipakai untuk mengenali akun lama.',
            'Toggle ini hanya menandai kontak orang tua, bukan siapa yang memakai akun.',
          ]} />
        </Callout>
      )}
      <Callout>
        <strong>Arahan untuk Agent</strong>
        {usesParentIdentity ? (
          <PointList items={[
            'Konfirmasi No. HP/email akun adalah milik orang tua.',
            'Jika bukan, matikan toggle dan isi ulang data sesuai informasi pembeli.',
          ]} />
        ) : (
          <PointList items={[
            'Biarkan toggle mati jika data akun adalah data anak.',
            'Lanjutkan dengan mengisi Data Parent dan Child sesuai informasi pembeli.',
          ]} />
        )}
      </Callout>
    </>
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
          <AccountResult name={existingAccount.name} phone={phone} serial={existingAccount.serial} />
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
          <strong>Parent + Child</strong>
          <div className="target-stack">
            <StructureTargetButton
              active={contactOwner === 'parent'}
              description="Kontak akun lama dikenali sebagai milik orang tua."
              label="Pilih"
              title="Parent"
              onClick={() => setContactOwner('parent')}
            />
            <StructureTargetButton
              active={contactOwner === 'child'}
              description="Kontak akun lama dikenali sebagai milik anak."
              label="Pilih"
              title="Child"
              onClick={() => setContactOwner('child')}
            />
          </div>
        </div>
      </div>

      <Callout variant={contactOwner === 'parent' ? 'warning' : 'info'}>
        <strong>{contactOwner ? 'Dampak migrasi' : 'Aksi berikutnya'}</strong>
        <PointList items={contactOwner === 'parent' ? [
          'Akun lama membantu mengenali customer yang akan dikonversi.',
          'Data Parent dan Child tetap diisi dari informasi pembeli.',
          'Username dan PIN anak dikirim ke WhatsApp Parent setelah transaksi berhasil.',
        ] : contactOwner === 'child' ? [
          'Akun aktif berubah ke struktur baru setelah transaksi berhasil.',
          'Agent tetap mengisi Data Parent dan Child dari informasi pembeli.',
          'No. HP/email anak tersimpan sebagai data profil, bukan akses login.',
        ] : [
          'Pilih Parent jika kontak akun lama milik orang tua.',
          'Pilih Child jika kontak akun lama milik siswa.',
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
  const contactLabel = contactOwner === 'parent' ? 'Data Parent' : 'Child'
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

function ResultStatePanel({ action, actionLabel, impact, status, title, variant = 'info' }: {
  action?: () => void
  actionLabel?: string
  impact: ReactNode[]
  status: ReactNode[]
  title: string
  variant?: CalloutVariant
}) {
  return (
    <Callout className="result-state-panel" icon={variant === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} variant={variant}>
      <strong>{title}</strong>
      <div className="result-state-grid">
        <div>
          <span>Status</span>
          <PointList items={status} />
        </div>
        <div>
          <span>Aksi Agent</span>
          <PointList items={impact} />
        </div>
      </div>
      {action && actionLabel && <button className="inline-action" type="button" onClick={action}>{actionLabel}</button>}
    </Callout>
  )
}

function ExistingNotRegistered({ setAccountStatus }: { setAccountStatus: (value: AccountStatus) => void }) {
  return (
    <ResultStatePanel
      action={() => setAccountStatus('new')}
      actionLabel="Pindah ke Belum Punya Akun"
      title="No. HP tidak terdaftar sebagai akun Ruangguru"
      variant="danger"
      status={[
        'Nomor tidak bisa dipakai sebagai akun aktif saat ini.',
        'Pembelian perlu dibuat lewat struktur Parent + Child baru.',
      ]}
      impact={[
        'Pindahkan ke flow Belum Punya Akun.',
        'Jika customer merasa sudah punya akun, minta email, no. HP, atau user serial lain.',
      ]}
    />
  )
}

function ExistingChildPhone({ setAccountStatus }: { setAccountStatus: (value: AccountStatus) => void }) {
  return (
    <ResultStatePanel
      action={() => setAccountStatus('new')}
      actionLabel="Pindah ke Belum Punya Akun"
      title="Data yang dimasukkan bukan akun aktif Ruangguru"
      variant="danger"
      status={[
        'Data terdeteksi sebagai kontak Child, bukan akun login.',
        'Child tidak bisa dipakai sebagai akun pembelian.',
      ]}
      impact={[
        'Cek ulang email, no. HP, atau user serial akun aktif.',
        <>Pindah ke <strong>Belum Punya Akun</strong> jika data ini akan didaftarkan sebagai Parent baru.</>,
      ]}
    />
  )
}

function NewAvailableAccount({ isChildContact = false, phone }: { isChildContact?: boolean; phone: string }) {
  return (
    <ResultStatePanel
      title="No. HP bisa digunakan untuk Parent baru"
      variant="success"
      status={[
        <>Nomor {phone} belum terdaftar sebagai akun Ruangguru.</>,
        isChildContact ? 'Nomor pernah muncul sebagai kontak Child, tapi bukan akun login.' : 'Nomor bisa dipakai untuk membuat struktur baru.',
      ]}
      impact={[
        'Lanjut isi Data Parent dan Child.',
        'Pastikan data mengikuti informasi yang diberikan pembeli.',
      ]}
    />
  )
}

function NewRegisteredAccount({ phone, setAccountStatus }: { phone: string; setAccountStatus: (value: AccountStatus) => void }) {
  const registeredAccount = getRegisteredParentAccount(phone) ?? existingAccount

  return (
    <>
      <ResultStatePanel
        action={() => setAccountStatus('existing')}
        actionLabel="Pindah ke Sudah Punya Akun"
        title="No. HP sudah terdaftar sebagai akun Ruangguru"
        variant="danger"
        status={[
          'Nomor sudah melekat ke satu akun Ruangguru.',
          'Nomor ini tidak perlu dibuat sebagai akun baru.',
        ]}
        impact={[
          'Pindahkan ke flow Sudah Punya Akun.',
          'Pilih Child tujuan paket atau proses migrasi jika akun belum memakai struktur baru.',
        ]}
      />
      <AccountResult
        name={registeredAccount.name}
        phone={phone}
        serial={registeredAccount.serial}
        statusLabel="Akun terdaftar"
        description="Gunakan flow Sudah Punya Akun untuk nomor ini."
      />
    </>
  )
}

function AccountResult({ description, label = 'Akun', name, phone, serial, statusLabel }: { description?: string; label?: string; name: string; phone: string; serial?: string; statusLabel?: string }) {
  return (
    <div className={statusLabel ? 'structure-target resolver-stack-card single account-result account-result-card success' : 'structure-target resolver-stack-card single account-result account-result-card'}>
      <div className="candidate-section parent-section">
        <span className="identity-avatar account" aria-hidden="true" />
        <div className="identity-copy">
          {statusLabel && <span className="parent-card-status"><CheckCircle2 size={14} /> {statusLabel}</span>}
          <div className="candidate-heading">
            <strong className="candidate-name parent-name">{name}</strong>
            <span>{phone}</span>
          </div>
          <div className="candidate-meta"><span className="identity-badge account">{label}</span><UserSerial value={serial} /></div>
          {description && <small>{description}</small>}
        </div>
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
  parentName,
  parentPhone,
  usesParentIdentity,
  setChildEmail,
  setChildName,
  setChildPhone,
  setGrade,
  setParentName,
  setParentPhone,
}: AccountFormProps) {
  const isMigration = mode === 'migration'
  const shouldCheckParentPhone = isMigration && !usesParentIdentity
  const parentPhoneAccount = shouldCheckParentPhone ? getRegisteredParentAccount(parentPhone) : null
  const parentPhoneIsCheckable = shouldCheckParentPhone && canCheckParentPhone(parentPhone)
  const shouldLockParentName = Boolean(parentPhoneAccount)
  const parentNameValue = parentPhoneAccount?.name ?? parentName

  return (
    <div className="form-fields">
      <h4>Data Parent</h4>
      <TextField
        helper={usesParentIdentity ? 'Nomor ini dikunci dari akun lama. Data lain tetap diisi sesuai informasi pembeli.' : undefined}
        label="No. HP Parent"
        placeholder="Masukan no. HP orang tua"
        readOnly={usesParentIdentity}
        value={parentPhone}
        onChange={setParentPhone}
      />
      {shouldCheckParentPhone && parentPhoneIsCheckable && (
        <ParentPhoneCheckResult account={parentPhoneAccount} phone={parentPhone} />
      )}
      <TextField
        helper={shouldLockParentName ? 'Dikunci dari akun yang ditemukan melalui No. HP Parent.' : undefined}
        label="Nama Parent"
        placeholder="Masukan nama lengkap orang tua"
        readOnly={shouldLockParentName}
        value={parentNameValue}
        onChange={setParentName}
      />
      <h4>Data Child</h4>
      <TextField label="Nama Lengkap Child" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak, bukan akses login utama. Nomor boleh sama dengan milik orang tua."
        label="No. HP Child"
        placeholder="Masukan no. HP anak (opsional)"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak, bukan akses login utama. Email boleh sama dengan milik orang tua."
        label="Email Child"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout className="strong">
        <strong>Yang perlu diberitahu ke anak/orang tua</strong>
        <PointList items={[
          isMigration ? 'Data Parent dan Child diisi sesuai informasi dari pembeli.' : 'Child baru dibuat di bawah Parent.',
          <>No. HP dan Email anak <strong>tidak bisa digunakan login</strong>.</>,
          'Username dan PIN dikirim ke WhatsApp Parent setelah transaksi berhasil.',
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
        <p>Nomor {phone} dapat digunakan untuk membuat Parent baru.</p>
      </Callout>
    )
  }

  return (
    <>
      <AccountResult
        name={account.name}
        phone={account.phone}
        serial={account.serial}
        statusLabel="Akun Parent ditemukan"
        description="No. HP ini sudah bisa dipakai sebagai Parent."
      />
      <Callout>
        <strong>Instruksi</strong>
        <PointList items={[
          `Pastikan No. HP ${phone} adalah akun orang tua dan bisa diakses.`,
          <>Jika lanjut, Child berelasi dengan akun <strong>{account.name}</strong>.</>,
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
  parentName: string
  parentPhone: string
  usesParentIdentity: boolean
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
  setParentName: (value: string) => void
  setParentPhone: (value: string) => void
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
  const parentDisplayName = selectedSearchProfile?.parentName ?? (parentName || parentAccount?.name || parentLabel)
  const parentDisplayPhone = selectedSearchProfile?.parentPhone ?? (parentPhone || parentAccount?.phone || parentNumberLabel)
  const targetProfileName = selectedSearchProfile
    ? selectedSearchProfile.name
    : parentAccount
    ? profileTarget === 'existing' && selectedProfile
      ? selectedProfile.name
      : childName || 'Child baru'
    : isNewAccount || usesParentIdentity
      ? childName || 'Child baru'
      : existingAccount.name
  const targetGrade = selectedSearchProfile?.grade ?? (parentAccount && profileTarget === 'existing' && selectedProfile ? selectedProfile.grade : grade || '-')
  const usesExistingProfile = Boolean(selectedSearchProfile || (parentAccount && profileTarget === 'existing' && selectedProfile))
  const reviewType = selectedSearchProfile || parentAccount ? 'Aktivasi paket' : isNewAccount ? 'Pembuatan akun' : 'Konversi akun'
  const title = selectedSearchProfile || parentAccount ? 'Review tujuan paket' : isNewAccount ? 'Review pembuatan akun' : 'Review migrasi akun'
  const reviewNote = selectedSearchProfile
    ? 'Paket akan aktif di Child yang ditemukan. Akses profil tidak berubah.'
    : parentAccount
    ? usesExistingProfile
      ? 'Paket akan aktif di profil yang dipilih. Akses profil tidak berubah.'
      : 'Profil baru akan dibuat sebelum paket diaktifkan.'
    : isNewAccount
      ? 'Struktur Parent dan Child baru akan dibuat.'
      : usesParentIdentity
        ? 'Data akun lama dipakai sebagai Parent.'
        : 'Akun aktif akan dikonversi menjadi Child.'
  const accessValue = usesExistingProfile ? 'Tidak berubah' : 'Username + PIN'
  const accessCopy = usesExistingProfile ? 'Gunakan akses profil yang sudah ada.' : parentAccount || isNewAccount ? 'Username dan PIN dikirim ke WhatsApp Parent.' : 'Login anak berubah ke Username dan PIN.'
  const consentCopy = usesExistingProfile ? 'Child dan Parent tujuan paket sudah dikonfirmasi ke customer.' : 'Perubahan akses login dan pemrosesan data sudah dijelaskan ke customer.'
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
          note={reviewNote}
          parentName={parentDisplayName}
          parentPhone={parentDisplayPhone}
          parentSerial={selectedSearchProfile?.parentSerial ?? parentAccount?.serial}
          profile={reviewProfile}
          typeLabel={reviewType}
        />

        <section className="review-access-card" aria-label="Akses Child">
          <span>Akses Child</span>
          <strong>{accessValue}</strong>
          <p>{accessCopy}</p>
        </section>

        <section className="review-checklist" aria-label="Yang perlu dipastikan">
          <h4>Pastikan sebelum lanjut</h4>
          <ReviewCheckItem>Profil tujuan paket sudah sesuai dengan customer.</ReviewCheckItem>
          {usesExistingProfile ? <ReviewCheckItem>Akses profil anak tetap mengikuti pengaturan yang sudah ada.</ReviewCheckItem> : <ReviewCheckItem>No. HP/email anak hanya tersimpan sebagai data profil.</ReviewCheckItem>}
        </section>

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
