import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Lock,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  X,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
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
  | 'existing-parent-cross-child-contact'
  | 'existing-parent-empty'
  | 'new-available'
  | 'new-registered'
type CalloutVariant = 'info' | 'warning' | 'danger' | 'success'
type PrototypeOptionId = '1' | '2' | '3' | '4' | '5' | '6'
type ContactOwner = 'child' | 'parent' | null
type LookupCheckOptions = { preserveSelectedTarget?: boolean }
type ProfileTarget = 'existing' | 'new' | null
type PackageIntent = 'renewal' | 'upgrade' | 'additional' | null
type LeadAssignmentStatus = 'assigned-to-me' | 'no-lead'
type WizardStep = 1 | 2 | 3 | 4 | 5

const GRADE_OPTIONS = [
  'Kelas 5 SD',
  'Kelas 6 SD',
  'Kelas 7 SMP',
  'Kelas 8 SMP',
  'Kelas 9 SMP',
  'Kelas 10 SMA',
  'Kelas 11 SMA',
  'Kelas 12 SMA',
]

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
  latestPurchaseDate?: string
  parentName?: string
  parentPhone?: string
  parentSerial?: string
  serial: string
}
type ParentProfileAccount = {
  leadStatus: LeadAssignmentStatus
  lastLoginAt: string
  name: string
  phone: string
  profiles: ChildProfile[]
  serial: string
}
type ParentAccountSummary = {
  leadStatus: LeadAssignmentStatus
  lastLoginAt: string
  name: string
  phone: string
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
  {
    id: '4',
    label: 'Opsi 4',
    title: 'Draft Invoice Review',
    summary: 'Duplikasi Opsi 1 sebagai kanvas baru. Perubahan berikutnya akan dilakukan per section di halaman draft invoice.',
    steps: ['Pilih status akun', 'Cek nomor', 'Lengkapi data migrasi', 'Review lalu pilih metode bayar'],
  },
  {
    id: '5',
    label: 'Opsi 5',
    title: 'Checkout-led Migration Copy',
    summary: 'Duplikasi Opsi 1 sebagai kanvas baru untuk iterasi berikutnya.',
    steps: ['Pilih status akun', 'Cek nomor', 'Lengkapi data migrasi', 'Review lalu pilih metode bayar'],
  },
  {
    id: '6',
    label: 'Opsi 6',
    title: 'Editable Info List',
    summary: 'Variasi Opsi 5 dengan data akun ditampilkan sebagai list informasi yang bisa diedit.',
    steps: ['Pilih status akun', 'Cek nomor', 'Edit data dari list informasi', 'Review lalu pilih metode bayar'],
  },
]

function isPrototypeOptionId(value: string | null): value is PrototypeOptionId {
  return value === '1' || value === '2' || value === '3' || value === '4' || value === '5' || value === '6'
}

function getInitialPrototypeOption(): PrototypeOptionId {
  if (typeof window === 'undefined') return '1'

  const option = new URLSearchParams(window.location.search).get('option')
  return isPrototypeOptionId(option) ? option : '1'
}

const existingAccount = {
  grade: 'Kelas 10 SMA',
  leadStatus: 'assigned-to-me' as LeadAssignmentStatus,
  lastLoginAt: '13 Mei 2026, 10:28',
  name: 'Keisha Azzahra',
  email: 'keisha.azzahra@studentmail.test',
  parentName: 'Andi Prasetyo',
  parentPhone: '081277001234',
  phone: '081234567890',
  serial: 'AZMIGD1L0YPTBMAR',
}

const registeredParentAccount = {
  leadStatus: 'no-lead' as LeadAssignmentStatus,
  lastLoginAt: '14 Mei 2026, 11:04',
  name: 'Dimas Pratama',
  phone: '081298765432',
  serial: 'AZMIGD1L0YPTDMSP',
}

const parentAccountWithSingleChild: ParentProfileAccount = {
  leadStatus: 'assigned-to-me',
  lastLoginAt: '14 Mei 2026, 08:45',
  name: 'Nadia Rahma',
  phone: '081381240015',
  serial: 'AZMIGD1L0YPTB015',
  profiles: [
    { contact: '081234700111', grade: 'Kelas 6 SD', id: 'rafa', leadStatus: 'assigned-to-me', lastLoginAt: '13 Mei 2026, 08:12', name: 'Rafa Alfarizi', serial: 'AZMIGD1L0YPTB111' },
  ],
}

const parentAccountWithChildren: ParentProfileAccount = {
  leadStatus: 'no-lead',
  lastLoginAt: '14 Mei 2026, 10:12',
  name: 'Agus Salim',
  phone: '081276540022',
  serial: 'AZMIGD1L0YPTB022',
  profiles: [
    { contact: '081234700555', grade: 'Kelas 5 SD', id: 'xiera', leadStatus: 'assigned-to-me', lastLoginAt: '12 Mei 2026, 19:42', name: 'Xiera Gentika', serial: 'AZMIGD1L0YPTXIGT' },
    { contact: '081234700555', grade: 'Kelas 8 SMP', hasActivePackage: true, id: 'salsabila', leadStatus: 'no-lead', lastLoginAt: '11 Mei 2026, 20:18', name: 'Salsabila Putri', latestPurchaseDate: '11 Mei 2026', packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'], serial: 'AZMIGD1L0YPTSBPT' },
  ],
}

const parentAccountWithCrossChildContact: ParentProfileAccount = {
  leadStatus: 'assigned-to-me',
  lastLoginAt: '14 Mei 2026, 09:42',
  name: 'Fajar Hidayat',
  phone: '081234700333',
  profiles: [
    { contact: '081234701333', grade: 'Kelas 7 SMP', id: 'child-raka-fajar-parent-login', leadStatus: 'assigned-to-me', lastLoginAt: '14 Mei 2026, 09:16', name: 'Raka Hidayat', serial: 'AZMIGD1L0YPTRK33' },
  ],
  serial: 'AZMIGD1L0YPTFJ33',
}

const parentAccountWithoutChildren: ParentProfileAccount = {
  leadStatus: 'no-lead',
  lastLoginAt: 'Belum ada data',
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
    latestPurchaseDate: '11 Mei 2026', packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'],
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
    latestPurchaseDate: '11 Mei 2026', packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'],
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

const parentLoginAndOtherParentChildContactResults: ChildProfile[] = [
  {
    contact: '081234700333',
    grade: 'Kelas 6 SD',
    id: 'child-naura-nadia-parent-login-overlap',
    leadStatus: 'no-lead',
    lastLoginAt: '14 Mei 2026, 09:18',
    name: 'Naura Qistina',
    parentName: parentAccountWithSingleChild.name,
    parentPhone: parentAccountWithSingleChild.phone,
    parentSerial: parentAccountWithSingleChild.serial,
    serial: 'AZMIGD1L0YPTNQ33',
  },
  {
    contact: '081234700333',
    grade: 'Kelas 8 SMP',
    hasActivePackage: true,
    id: 'child-satrio-agus-parent-login-overlap',
    leadStatus: 'assigned-to-me',
    lastLoginAt: '13 Mei 2026, 20:06',
    name: 'Satrio Wibowo',
    latestPurchaseDate: '10 Mei 2026',
    packageNames: ['ruangbelajar SMP 1 Tahun'],
    parentName: parentAccountWithChildren.name,
    parentPhone: parentAccountWithChildren.phone,
    parentSerial: parentAccountWithChildren.serial,
    serial: 'AZMIGD1L0YPTSW33',
  },
  {
    contact: '081234700333',
    grade: 'Kelas 10 SMA',
    id: 'child-laras-ratih-parent-login-overlap',
    leadStatus: 'no-lead',
    lastLoginAt: '10 Mei 2026, 21:03',
    name: 'Laras Maharani',
    parentName: 'Ratih Pramesti',
    parentPhone: '081217003388',
    parentSerial: 'AZMIGD1L0YPTRTPR',
    serial: 'AZMIGD1L0YPTLM33',
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
    latestPurchaseDate: '11 Mei 2026', packageNames: ['ruangbelajar SMP 1 Tahun', 'Roboguru Plus 6 Bulan'],
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
  ...parentLoginAndOtherParentChildContactResults,
  ...mixedChildProfileSearchResults,
].filter((profile, index, profiles) => profiles.findIndex((item) => item.id === profile.id) === index)

function getRegisteredParentAccount(phone: string): ParentAccountSummary | null {
  const normalizedPhone = phone.replace(/\D/g, '')

  if (normalizedPhone === registeredParentAccount.phone || normalizedPhone.includes('765432')) {
    return registeredParentAccount
  }

  if (isParentAccountWithSingleChildPhone(phone)) return parentAccountWithSingleChild
  if (isParentAccountWithChildrenPhone(phone)) return parentAccountWithChildren
  if (isParentAccountWithCrossChildContactPhone(phone)) return parentAccountWithCrossChildContact
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
    accountLeadStatus: account.leadStatus,
    accountLastLoginAt: account.lastLoginAt,
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

function isParentAccountWithCrossChildContactPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  return normalizedPhone === parentAccountWithCrossChildContact.phone
    || normalizedPhone.includes('700333')
    || parentAccountSerialMatchesInput(parentAccountWithCrossChildContact, phone)
}

function isParentAccountWithoutChildrenPhone(phone: string) {
  return phone.replace(/\D/g, '').includes('880044') || parentAccountSerialMatchesInput(parentAccountWithoutChildren, phone)
}

function isParentProfileLookup(lookupState: LookupState) {
  return lookupState === 'existing-parent-single-child' || lookupState === 'existing-parent-with-children' || lookupState === 'existing-parent-cross-child-contact' || lookupState === 'existing-parent-empty'
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
  if (lookupState === 'existing-parent-cross-child-contact') return parentAccountWithCrossChildContact
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
  if (lookupState === 'existing-parent-cross-child-contact') return parentLoginAndOtherParentChildContactResults
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
  const parentIdentity = { name: profile.parentName, phone: profile.parentPhone, serial: profile.parentSerial }

  return {
    leadStatus: getParentLeadStatus(parentIdentity),
    lastLoginAt: getParentLastLoginAt(parentIdentity) ?? 'Belum ada data',
    name: profile.parentName ?? 'Orang Tua',
    phone: profile.parentPhone ?? '',
    profiles: [profile],
    serial: profile.parentSerial ?? '',
  }
}

type ParentIdentityLookup = { leadStatus?: LeadAssignmentStatus; lastLoginAt?: string; name?: string; phone?: string; serial?: string }

function findKnownParentAccount(identity: ParentIdentityLookup) {
  const normalizedPhone = normalizePhoneDigits(identity.phone ?? '')
  const knownParents = [
    parentAccountWithSingleChild,
    parentAccountWithChildren,
    parentAccountWithCrossChildContact,
    parentAccountWithoutChildren,
  ]

  return knownParents.find((account) => (
    Boolean(identity.serial && account.serial === identity.serial)
    || Boolean(normalizedPhone && normalizePhoneDigits(account.phone) === normalizedPhone)
    || Boolean(identity.name && account.name === identity.name)
  )) ?? null
}

function getParentLeadStatus(identity: ParentIdentityLookup): LeadAssignmentStatus {
  return identity.leadStatus ?? findKnownParentAccount(identity)?.leadStatus ?? 'no-lead'
}

function getParentLastLoginAt(identity: ParentIdentityLookup) {
  return identity.lastLoginAt ?? findKnownParentAccount(identity)?.lastLoginAt
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

function getLatestPackageName(profile: ChildProfile) {
  const packages = getActivePackageNames(profile)
  return packages[packages.length - 1]
}

function getLatestPurchaseDate(profile: ChildProfile) {
  return profile.latestPurchaseDate ?? '11 Mei 2026'
}

function LastLoginLine({ value }: { value?: string }) {
  return <small className="last-login-line">Login terakhir: {value ?? 'Belum ada data'}</small>
}

function ActivePackageLines({ profile }: { profile: ChildProfile }) {
  const packageName = getLatestPackageName(profile)

  if (!packageName) return null

  return (
    <div className="active-package-list" aria-label="Pembelian terakhir">
      <span>Pembelian terakhir - {getLatestPurchaseDate(profile)}</span>
      <strong>{packageName}</strong>
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
  const [selectedParentLookupProfileId, setSelectedChildProfileId] = useState('')
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
  const [confirmationError, setConfirmationError] = useState(false)

  const isExistingFlow = accountStatus === 'existing'
  const isOptionTwo = prototypeOption === '2'
  const isOptionThree = prototypeOption === '3'
  const isOptionFour = prototypeOption === '4'
  const isOptionFive = prototypeOption === '5'
  const isOptionSix = prototypeOption === '6'
  const isSheetLookupOption = isOptionFive || isOptionSix
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
  const selectedParentLookupProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId) ?? selectedChildSearchProfile
  const shouldCreateProfileForParent = Boolean(parentLookupAccount && profileTarget === 'new')
  const duplicateProfileMatches = parentLookupAccount && shouldCreateProfileForParent ? getDuplicateProfileMatches(parentLookupAccount.profiles, childName) : []
  const duplicateProfileBlocking = duplicateProfileMatches.length > 0 && !duplicateProfileAcknowledged
  const searchProfileReady = Boolean((isSearchResolutionLookup(lookupState) || isOldAccountOverlapLookup) && selectedChildSearchProfile)
  const showMigrationForm = isExistingFlow && isOldAccountLookup(lookupState) && hasContactOwnerDecision && legacyAccountSelected
  const showNewAccountForm = accountStatus === 'new' && (lookupState === 'new-available' || isSheetLookupOption)
  const effectiveParentPhone = parentAccountForUpdate ? parentUpdateState?.nextPhone ?? parentAccountForUpdate.phone : showNewAccountForm ? parentPhone || phone : parentContactSelected ? phone : parentPhone
  const effectiveParentAccount = parentContactSelected || parentAccountForUpdate ? null : getRegisteredParentAccount(effectiveParentPhone)
  const effectiveParentName = parentAccountForUpdate ? parentUpdateState?.nextName ?? parentAccountForUpdate.name : effectiveParentAccount?.name || parentName || ''
  const effectiveChildName = selectedParentLookupProfile?.name ?? childName
  const newParentPhoneRegistered = Boolean(showNewAccountForm && canCheckParentPhone(effectiveParentPhone) && getRegisteredParentAccount(effectiveParentPhone))
  const parentDataReady = Boolean(canCheckParentPhone(effectiveParentPhone))
  const multipleMatchReady = Boolean(lookupState === 'existing-multiple-matches' && selectedChildSearchProfile)
  const oldAccountOverlapReady = Boolean(isOldAccountOverlapLookup && (selectedChildSearchProfile || legacyAccountSelected))
  const childProfileFormReady = Boolean(childName.trim() && grade)
  const childDataReady = Boolean(effectiveChildName.trim() && (selectedParentLookupProfile ? true : grade))
  const parentProfileTargetReady = Boolean(
    parentLookupAccount
    && !parentUpdateBlocked
    && (profileTarget === 'existing' ? selectedParentLookupProfile : shouldCreateProfileForParent && childProfileFormReady && !duplicateProfileBlocking),
  )
  const migrationFormReady = Boolean(showMigrationForm && parentDataReady && childDataReady)
  const newAccountFormReady = Boolean(
    showNewAccountForm
    && canCheckParentPhone(effectiveParentPhone)
    && !newParentPhoneRegistered
    && childName.trim()
    && grade,
  )
  const invoiceDetailReady = Boolean(parentProfileTargetReady || migrationFormReady || newAccountFormReady)
  const draftReviewReady = Boolean(invoiceDetailReady || searchProfileReady || (isOldAccountOverlapLookup && selectedChildSearchProfile))
  const dynamicWizardSteps = getDynamicWizardSteps({
    accountStatus,
    legacyAccountSelected,
    lookupState,
    profileTarget,
    selectedParentLookupProfileId,
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
          if (profileTarget === 'existing' && selectedParentLookupProfile) return { label: 'Review Tujuan Paket', disabled: parentUpdateBlocked }
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
        if (profileTarget === 'existing') return { label: 'Review Tujuan Paket', disabled: !selectedParentLookupProfile || parentUpdateBlocked }
        if (profileTarget === 'new') return { label: 'Lanjut Isi Anak', disabled: false }
        return { label: 'Pilih Profil Tujuan', disabled: true }
      }
      if (wizardStep === 2) return { label: 'Lanjut Isi Data Orang Tua', disabled: contactOwner === null }
      if (wizardStep === 3) return { label: 'Lanjut Isi Anak', disabled: !parentDataReady }
      if (wizardStep === 4) return { label: parentLookupAccount ? (duplicateProfileBlocking ? 'Cek Profil Mirip' : 'Review Tujuan Paket') : 'Review Migrasi', disabled: parentLookupAccount ? !childProfileFormReady || duplicateProfileBlocking : !childDataReady }
      return { label: 'Lanjut Pilih Metode Bayar', disabled: !consent }
    }

    if (isOptionFour) {
      return { label: draftReviewReady ? 'Lanjut Pilih Metode Bayar' : 'Pilih Akun Tujuan', disabled: !draftReviewReady || !consent }
    }

    if (isSheetLookupOption) {
      return { label: draftReviewReady ? 'Pilih Metode Pembayaran' : 'Pilih Akun Tujuan', disabled: !draftReviewReady }
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
  }, [accountStatus, childDataReady, childProfileFormReady, consent, contactOwner, duplicateProfileBlocking, isOldAccountOverlapLookup, isOptionThree, legacyAccountSelected, lookupState, migrationFormReady, multipleMatchReady, newAccountFormReady, parentDataReady, parentLookupAccount, parentProfileTargetReady, profileTarget, searchProfileReady, selectedParentLookupProfile, selectedChildSearchProfile, usesMappingDecision, wizardStep, parentUpdateBlocked, isOptionFour, isSheetLookupOption, draftReviewReady])

  const disabledReason = (() => {
    if (!cta.disabled || isOptionThree) return null
    if ((isOptionFour || isSheetLookupOption) && draftReviewReady && !consent) return 'Centang konfirmasi agent'
    if ((isOptionFour || isSheetLookupOption) && !draftReviewReady) return 'Pilih akun tujuan pembelian'
    if (!accountStatus) return 'Pilih status akun customer'
    if (isSheetLookupOption && accountStatus === 'new' && !newAccountFormReady) return 'Lengkapi data Orang Tua dan Anak baru'
    if (lookupState === 'idle') return 'Input No. HP atau user serial lalu cek akun'
    if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone' || lookupState === 'new-registered') return 'Ikuti instruksi pada hasil pencarian'
    if (isOldAccountOverlapLookup && !oldAccountOverlapReady) return 'Pilih Anak tujuan paket'
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
    setConfirmationError(false)
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
    setConfirmationError(false)
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
    setParentUpdatePhone('')
    if (value !== 'new') setDuplicateProfileAcknowledged(false)
  }

  const handleSelectedChildProfileIdChange = (value: string) => {
    setSelectedChildProfileId(value)
    setPackageIntent(null)
    setParentUpdatePhone('')
    setDuplicateProfileAcknowledged(false)
  }

  const handleSelectedChildSearchProfileIdChange = (value: string) => {
    setSelectedChildSearchProfileId(value)
    setLegacyAccountSelected(false)
    setPackageIntent(null)
    setParentUpdatePhone('')
  }

  const handlePrototypeOptionChange = (option: PrototypeOptionId) => {
    setPrototypeOption(option)
    resetFlowState()

    const url = new URL(window.location.href)
    url.searchParams.set('option', option)
    window.history.pushState({}, '', url)
  }

  const checkNumber = (options: LookupCheckOptions = {}) => {
    const normalizedPhone = phone.replace(/\D/g, '')
    const preserveSelectedTarget = Boolean(options.preserveSelectedTarget)

    setContactOwner(null)
    if (!preserveSelectedTarget) {
      setProfileTarget(null)
      setSelectedChildProfileId('')
      setSelectedChildSearchProfileId('')
      setLegacyAccountSelected(false)
    }
    setConsent(false)
    setConfirmationError(false)
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

      if (isParentAccountWithCrossChildContactPhone(phone)) {
        setLookupState('existing-parent-cross-child-contact')
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
    if (isOptionFour) {
      setDoneOpen(true)
      return
    }

    if (isSheetLookupOption) {
      if (!consent) {
        setConfirmationError(true)
        return
      }

      setConfirmationError(false)
      setDoneOpen(true)
      return
    }

    if (!isOptionThree) {
      setReviewOpen(true)
      return
    }

    if (wizardStep === 1) {
      if (searchProfileReady || (parentLookupAccount && profileTarget === 'existing' && selectedParentLookupProfile)) {
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
          {!isOptionThree && <OrderCard compact={!invoiceDetailReady} showBenefits={isOptionSix} />}
          {!isSheetLookupOption && <DiscountCard />}
          {!isSheetLookupOption && <PaymentDetailCard />}
          {prototypeOption === '1' || prototypeOption === '2' || prototypeOption === '3' || prototypeOption === '4' || prototypeOption === '5' || prototypeOption === '6' ? (
            <PurchasePurposeCard
              accountStatus={accountStatus}
              childName={childName}
              consent={consent}
              confirmationError={confirmationError}
              canConfirmPurchase={draftReviewReady && !parentUpdateBlocked}
              contactOwner={contactOwner}
              checkNumber={checkNumber}
              grade={grade}
              duplicateProfileAcknowledged={duplicateProfileAcknowledged}
              duplicateProfileMatches={duplicateProfileMatches}
              isBeforeAfterMapping={isOptionThree}
              isDraftReview={isOptionFour}
              isExplicitMapping={isOptionTwo}
              isSheetLookup={isSheetLookupOption}
              useEditableInfoList={isOptionSix}
              legacyAccountSelected={legacyAccountSelected}
              lookupState={lookupState}
              lookupPickerOpen={lookupPickerOpen}
              setWizardStep={setWizardStep}
              childEmail={childEmail}
              childPhone={childPhone}
              profileTarget={profileTarget}
              selectedParentLookupProfileId={selectedParentLookupProfileId}
              selectedChildSearchProfileId={selectedChildSearchProfileId}
              setLookupState={setLookupState}
              setLookupPickerOpen={setLookupPickerOpen}
              parentName={parentName}
              parentPhone={parentPhone}
              phone={phone}
              setAccountStatus={handleAccountStatusChange}
              setChildEmail={setChildEmail}
              setConsent={setConsent}
              setConfirmationError={setConfirmationError}
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
          {(isOptionFive || isOptionSix) && <DiscountCard />}
          {(isOptionFive || isOptionSix) && <PaymentDetailCard />}
        </div>

        <BottomCta
          contextLabel={isOptionThree ? (dynamicWizardSteps.length === 1 ? 'Langkah saat ini' : `Tahap ${currentWizardIndex + 1}/${dynamicWizardSteps.length}`) : disabledReason ? 'Yang perlu dilakukan' : undefined}
          contextValue={isOptionThree ? getWizardStepTitle(wizardStep) : disabledReason ?? undefined}
          disabled={cta.disabled}
          label={cta.label}
          onClick={handleBottomCtaClick}
        />

        {reviewOpen && !isOptionFive && (
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
            selectedParentLookupProfileId={selectedParentLookupProfileId}
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

function OrderCard({ compact = false, showBenefits = false }: { compact?: boolean; showBenefits?: boolean }) {
  const shouldShowBenefits = showBenefits || !compact

  return (
    <SectionCard className={compact ? 'order-card compact-order-card' : 'order-card'} title="Detail Pemesanan">
      <FieldBlock label="Nama Paket">
        <p>ruangbelajar SMA/SMK 1 Tahun</p>
      </FieldBlock>
      {shouldShowBenefits && (
        <FieldBlock label="Deskripsi Paket">
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <IconText icon={<CheckCircle2 size={13} />} key={benefit}>{benefit}</IconText>
            ))}
          </div>
        </FieldBlock>
      )}
      {compact && !shouldShowBenefits && <small className="compact-invoice-note">Kode diskon dan ringkasan pembayaran bisa disiapkan sebelum review.</small>}
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
  confirmationError = false,
  canConfirmPurchase = true,
  contactOwner,
  duplicateProfileAcknowledged,
  duplicateProfileMatches,
  grade,
  isBeforeAfterMapping,
  isDraftReview,
  isExplicitMapping,
  isSheetLookup,
  useEditableInfoList = false,
  legacyAccountSelected,
  lookupState,
  lookupPickerOpen,
  parentName,
  parentPhone,
  parentUpdateName = '',
  parentUpdatePhone = '',
  phone,
  profileTarget,
  selectedParentLookupProfileId,
  selectedChildSearchProfileId,
  setAccountStatus,
  setChildEmail,
  setChildName,
  setChildPhone,
  setConsent,
  setConfirmationError = () => {},
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
  const parentLookupSelectionReady = Boolean(parentLookupAccount && (profileTarget === 'new' || (profileTarget === 'existing' && selectedParentLookupProfileId)))
  const optionFiveTargetSelected = Boolean((selectedSearchParentAccount && selectedChildSearchProfile) || parentLookupSelectionReady || showMigrationForm || showNewAccountForm)
  const [optionFiveTargetPickerOpen, setOptionFiveTargetPickerOpen] = useState(false)

  const optionFiveLookupProps = {
    accountStatus,
    checkNumber,
    contactOwner,
    isExplicitMapping,
    legacyAccountSelected,
    lookupPickerOpen,
    lookupState,
    phone,
    profileTarget,
    selectedParentLookupProfileId,
    selectedChildSearchProfileId,
    setAccountStatus,
    setContactOwner,
    setLegacyAccountSelected,
    setLookupPickerOpen,
    setLookupState,
    setPackageIntent,
    setPhone,
    setProfileTarget,
    setSelectedChildProfileId,
    setSelectedChildSearchProfileId,
  }

  const selectedOptionFiveProfileTitle = selectedChildSearchProfile?.name
    ?? parentLookupAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId)?.name
    ?? (legacyAccountSelected ? existingAccount.name : profileTarget === 'new' ? 'Profil Anak baru' : '')
  const optionFiveTargetHelper = optionFiveTargetSelected
    ? selectedOptionFiveProfileTitle
    : accountStatus === 'existing'
      ? 'Cari dengan No. HP atau User Serial.'
      : accountStatus === 'new'
        ? 'Pastikan nomor bisa dipakai untuk akun baru.'
        : 'Pilih status kepemilikan akun di bagian atas.'
  const optionFiveTargetTitle = optionFiveTargetSelected
    ? 'Ubah akun tujuan'
    : accountStatus === 'existing'
      ? 'Pilih profil Anak tujuan'
      : 'Cek nomor Orang Tua'
  const openOptionFiveTargetPicker = () => setOptionFiveTargetPickerOpen(true)
  const optionFiveSearchTrigger = (
    <AccountTargetSearchTrigger
      className="option-five-search-trigger"
      disabled={!accountStatus}
      helper={optionFiveTargetHelper}
      title={optionFiveTargetTitle}
      onClick={openOptionFiveTargetPicker}
    />
  )
  const optionFiveChangeTargetAction = (
    <button className="option-five-change-target" type="button" onClick={openOptionFiveTargetPicker}>Ganti profil</button>
  )
  const selectOptionFiveAccountStatus = (status: AccountStatus) => {
    setAccountStatus(status)
    setLookupPickerOpen(false)
    setOptionFiveTargetPickerOpen(false)
    setLookupState('idle')
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setLegacyAccountSelected(false)
    setParentUpdatePhone('')
  }

  const optionFiveTargetPickerSheet = isSheetLookup && optionFiveTargetPickerOpen ? (
    <AccountTargetSearchSheet
      {...optionFiveLookupProps}
      checkNumber={(options) => checkNumber({ ...options, preserveSelectedTarget: optionFiveTargetSelected || options?.preserveSelectedTarget })}
      title={accountStatus === 'new' ? 'Cek No. HP Orang Tua' : 'Akun yang dipakai untuk login'}
      onClose={() => setOptionFiveTargetPickerOpen(false)}
    />
  ) : null

  if (isDraftReview) {
    return (
      <DraftReviewPurposeCard
        accountStatus={accountStatus}
        checkNumber={checkNumber}
        childEmail={childEmail}
        childName={childName}
        childPhone={childPhone}
        consent={consent}
        contactOwner={contactOwner}
        duplicateProfileAcknowledged={duplicateProfileAcknowledged}
        duplicateProfileMatches={duplicateProfileMatches}
        grade={grade}
        isBeforeAfterMapping={false}
        isDraftReview={isDraftReview}
        isExplicitMapping={isExplicitMapping}
        isSheetLookup={isSheetLookup}
        legacyAccountSelected={legacyAccountSelected}
        lookupState={lookupState}
        lookupPickerOpen={lookupPickerOpen}
        parentName={parentName}
        parentPhone={parentPhone}
        phone={phone}
        profileTarget={profileTarget}
        selectedParentLookupProfileId={selectedParentLookupProfileId}
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
        setUsesParentIdentity={setUsesParentIdentity}
        setWizardStep={setWizardStep}
        showMigrationForm={showMigrationForm}
        showNewAccountForm={showNewAccountForm}
        usesParentIdentity={usesParentIdentity}
        wizardStep={wizardStep}
      />
    )
  }

  const selectedParentLookupProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId) ?? null
  const confirmationParentAccount = selectedSearchParentAccount ?? parentLookupAccount
  const confirmationParentName = confirmationParentAccount?.name ?? (parentUpdateName || parentName || 'Orang Tua')
  const confirmationParentPhone = confirmationParentAccount ? parentUpdatePhone || confirmationParentAccount.phone : parentPhone || phone
  const confirmationParentEmail = buildPrototypeEmail(confirmationParentName, 'emailorangtua@gm.com')
  const confirmationChildPhone = selectedChildSearchProfile?.contact
    ?? selectedParentLookupProfile?.contact
    ?? childPhone
    ?? (legacyAccountSelected ? existingAccount.phone : '')

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
          phone={phone}
          profileTarget={profileTarget}
          selectedParentLookupProfileId={selectedParentLookupProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setAccountStatus={setAccountStatus}
          setContactOwner={setContactOwner}
          setChildEmail={setChildEmail}
          setChildName={setChildName}
          setChildPhone={setChildPhone}
          setConsent={setConsent}
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
    <SectionCard className={`purpose-card ${isSheetLookup ? 'option-five-purpose' : ''}`.trim()} title="Tujuan Pembelian Paket">
      <StagePanel className={isSheetLookup ? 'option-five-status-stage compact-status-section' : ''} step="TAHAP 1" title={isSheetLookup ? 'Apakah sudah punya akun Ruangguru?' : 'Pilih Status Kepemilikan Akun'}>
        {isSheetLookup ? (
          <div className="draft-status-segment" role="group" aria-label="Kondisi akun customer">
            <button className={accountStatus === 'existing' ? 'active' : ''} type="button" onClick={() => selectOptionFiveAccountStatus('existing')}>
              <span className="segment-copy">
                <strong>Sudah punya akun</strong>
                <small>Cari akun atau profil yang akan dibelikan paket.</small>
              </span>
              <span className="segment-radio" aria-hidden="true" />
            </button>
            <button className={accountStatus === 'new' ? 'active' : ''} type="button" onClick={() => selectOptionFiveAccountStatus('new')}>
              <span className="segment-copy">
                <strong>Belum punya akun</strong>
                <small>Buat akun Orang Tua dan profil Anak baru untuk pembelian ini.</small>
              </span>
              <span className="segment-radio" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </StagePanel>

      {isSheetLookup && optionFiveTargetPickerSheet}

      {isSheetLookup ? (
        accountStatus && !optionFiveTargetSelected ? (
          <StagePanel className="option-five-search-stage" step="TAHAP 2" title="Paket akan dibeli untuk">
            {optionFiveSearchTrigger}
          </StagePanel>
        ) : null
      ) : (
        <LookupStage
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          legacyAccountSelected={legacyAccountSelected}
          lookupState={lookupState}
          lookupPickerOpen={lookupPickerOpen}
          profileTarget={profileTarget}
          selectedParentLookupProfileId={selectedParentLookupProfileId}
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
      )}

      {selectedSearchParentAccount && selectedChildSearchProfile && (
        <StagePanel className={`form-stage ${isSheetLookup ? 'option-five-selected-stage' : ''}`.trim()} step="TAHAP 3" title={isSheetLookup ? 'Paket akan dibeli untuk' : 'Lengkapi Data Orang Tua'}>
          <DraftInvoiceSelectedAccountDetails
            key={selectedSearchParentAccount.serial + '-' + selectedChildSearchProfile.id}
            account={selectedSearchParentAccount}
            changeTargetAction={isSheetLookup ? optionFiveChangeTargetAction : undefined}
            layout={useEditableInfoList ? 'info-list' : 'card'}
            matchedValue={phone}
            parentUpdatePhone={parentUpdatePhone}
            profile={selectedChildSearchProfile}
            setParentUpdatePhone={setParentUpdatePhone}
          />
        </StagePanel>
      )}

      {parentLookupAccount && parentLookupSelectionReady && (
        <StagePanel className={`form-stage ${isSheetLookup ? 'option-five-selected-stage' : ''}`.trim()} step="TAHAP 3" title={isSheetLookup ? 'Paket akan dibeli untuk' : 'Profil Tujuan Aktivasi Paket'}>
          {isSheetLookup && profileTarget === 'existing' && selectedParentLookupProfile ? (
            <DraftInvoiceSelectedAccountDetails
              key={parentLookupAccount.serial + '-' + selectedParentLookupProfile.id}
              account={parentLookupAccount}
              changeTargetAction={optionFiveChangeTargetAction}
              layout={useEditableInfoList ? 'info-list' : 'card'}
              matchedValue={phone}
              parentUpdatePhone={parentUpdatePhone}
              profile={selectedParentLookupProfile}
              setParentUpdatePhone={setParentUpdatePhone}
            />
          ) : isSheetLookup && profileTarget === 'new' ? (
            <OptionFiveNewChildDetails
              account={parentLookupAccount}
              changeTargetAction={optionFiveChangeTargetAction}
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              duplicateProfileAcknowledged={duplicateProfileAcknowledged}
              duplicateProfileMatches={duplicateProfileMatches}
              grade={grade}
              layout={useEditableInfoList ? 'info-list' : 'card'}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setDuplicateProfileAcknowledged={setDuplicateProfileAcknowledged}
              setGrade={setGrade}
              setParentUpdatePhone={setParentUpdatePhone}
              setProfileTarget={setProfileTarget}
              setSelectedChildProfileId={setSelectedChildProfileId}
            />
          ) : (
            <>
              {isSheetLookup && optionFiveSearchTrigger}
              <ProfileTargetStage
                account={parentLookupAccount}
                childEmail={childEmail}
                childName={childName}
                childPhone={childPhone}
                grade={grade}
                profileTarget={profileTarget}
                selectedParentLookupProfileId={selectedParentLookupProfileId}
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
            </>
          )}
        </StagePanel>
      )}

      {showMigrationForm && (
        <>
          {isExplicitMapping && contactOwner && !isSheetLookup && <MigrationStateSummary contactOwner={contactOwner} phone={phone} />}

          <StagePanel className={`form-stage ${isSheetLookup ? 'option-five-selected-stage' : ''}`.trim()} step="TAHAP 3" title={isSheetLookup ? 'Paket akan dibeli untuk' : 'Lengkapi Data Orang Tua dan Anak'}>
            {isSheetLookup ? (
              <OptionFiveLegacyChildDetails
                changeTargetAction={optionFiveChangeTargetAction}
                childEmail={childEmail}
                childName={childName}
                childPhone={childPhone}
                grade={grade}
                layout={useEditableInfoList ? 'info-list' : 'card'}
                matchedValue={phone}
                setChildEmail={setChildEmail}
                setChildName={setChildName}
                setChildPhone={setChildPhone}
                setGrade={setGrade}
              />
            ) : (
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
            )}
          </StagePanel>
        </>
      )}

      {showNewAccountForm && (
        <StagePanel className={`form-stage ${isSheetLookup ? 'option-five-selected-stage' : ''}`.trim()} step="TAHAP 3" title={isSheetLookup ? 'Lengkapi data orang tua dan anak' : 'Buat Orang Tua dan Anak'}>
          {useEditableInfoList ? (
            <OptionSixNewAccountDetails
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              parentPhone={parentPhone || phone}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
              setParentPhone={setParentPhone}
            />
          ) : (
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
          )}
        </StagePanel>
      )}

      {isSheetLookup && optionFiveTargetSelected && (
        <PurchaseConfirmationBlock
          childPhone={confirmationChildPhone}
          consent={consent}
          parentEmail={confirmationParentEmail}
          parentPhone={confirmationParentPhone}
          canConfirm={canConfirmPurchase}
          errorMessage={canConfirmPurchase ? 'Centang konfirmasi agent sebelum memilih metode pembayaran.' : 'Lengkapi data yang masih kosong sebelum konfirmasi.'}
          setConsent={(value) => {
            if (value && !canConfirmPurchase) {
              setConsent(false)
              setConfirmationError(true)
              return
            }

            setConsent(value)
            if (value) setConfirmationError(false)
          }}
          showError={confirmationError}
        />
      )}
    </SectionCard>
  )
}



function HighlightedReviewValue({ children }: { children: ReactNode }) {
  return <strong className="review-highlight-value">{children}</strong>
}



function AccountTargetSearchTrigger({ className = '', disabled = false, helper, onClick, title }: { className?: string; disabled?: boolean; helper: string; onClick: () => void; title: string }) {
  return (
    <button className={['lookup-notice-trigger', 'info', className].filter(Boolean).join(' ')} disabled={disabled} type="button" onClick={onClick}>
      <span>{title}</span>
      <small>{helper}</small>
      <ChevronRight size={16} />
    </button>
  )
}

function SelectedPackageTargetHero({ action, label = 'Profil Anak', title }: { action?: ReactNode; label?: string; title: string }) {
  return (
    <div className="draft-child-hero compact">
      <div>
        <span>{label}</span>
        <strong>{title}</strong>
      </div>
      {action && <div className="draft-hero-actions">{action}</div>}
    </div>
  )
}

function PurchaseConfirmationBlock({ canConfirm = true, childPhone, consent, errorMessage = 'Centang konfirmasi agent sebelum memilih metode pembayaran.', parentEmail, parentPhone, setConsent, showError = false }: {
  canConfirm?: boolean
  childPhone?: string
  consent: boolean
  errorMessage?: string
  parentEmail: string
  parentPhone: string
  setConsent: (value: boolean) => void
  showError?: boolean
}) {
  const parentPhoneText = parentPhone || '-'
  const childPhoneText = childPhone || ''
  const detailRef = useRef<HTMLDivElement>(null)
  const previousConsentRef = useRef(consent)

  useEffect(() => {
    const wasConsent = previousConsentRef.current
    previousConsentRef.current = consent

    if (!wasConsent && consent) {
      window.requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [consent])

  return (
    <section className="purchase-confirmation-block" aria-label="Konfirmasi data dan pengiriman">
      <label className={showError ? 'purchase-confirmation-check error' : 'purchase-confirmation-check'}>
        <input checked={consent} type="checkbox" aria-invalid={showError && !canConfirm} onChange={(event) => setConsent(event.target.checked)} />
        <span>Agent sudah memastikan data yang dimasukkan benar dan terupdate.</span>
      </label>
      {showError && <p className="purchase-confirmation-error">{errorMessage}</p>}

      {consent && (
        <>
          <div className="confirmation-summary-grid" ref={detailRef}>
            <div className="login-access-panel">
              <div className="login-access-head">
                <Mail size={15} />
                <span>Invoice pembelian</span>
              </div>
              <div className="login-access-list">
                <div>
                  <small>Invoice dikirim ke</small>
                  <p>WA Orang Tua <HighlightedReviewValue>{parentPhoneText}</HighlightedReviewValue> dan Email <HighlightedReviewValue>{parentEmail}</HighlightedReviewValue>.</p>
                </div>
              </div>
            </div>

            <div className="login-access-panel">
              <div className="login-access-head">
                <Lock size={15} />
                <span>Informasi login</span>
              </div>
              <div className="login-access-list">
                <div>
                  <small>Orang Tua login dengan</small>
                  <p>No. HP <HighlightedReviewValue>{parentPhoneText}</HighlightedReviewValue> atau Email <HighlightedReviewValue>{parentEmail}</HighlightedReviewValue>.</p>
                </div>
                <div>
                  <small>Anak belajar dengan</small>
                  <p>Username dan PIN yang dikirim ke WA Orang Tua <HighlightedReviewValue>{parentPhoneText}</HighlightedReviewValue>{childPhoneText ? <> / WA Anak <HighlightedReviewValue>{childPhoneText}</HighlightedReviewValue></> : ''}.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
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
  parentUpdateName = '',
  parentUpdatePhone = '',
  phone,
  profileTarget,
  selectedParentLookupProfileId,
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
        selectedParentLookupProfileId={selectedParentLookupProfileId}
        selectedChildSearchProfileId={selectedChildSearchProfileId}
        wizardStep={wizardStep}
      />
      {wizardStep > 1 && <WizardBackButton onClick={goBack} />}

      {wizardStep === 1 && (
        <WizardLookupStep
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          contactOwner={contactOwner}
          legacyAccountSelected={legacyAccountSelected}
          lookupState={lookupState}
          lookupPickerOpen={lookupPickerOpen}
          phone={phone}
          profileTarget={profileTarget}
          selectedParentLookupProfileId={selectedParentLookupProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setAccountStatus={setAccountStatus}
          setContactOwner={setContactOwner}
          setLegacyAccountSelected={setLegacyAccountSelected}
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
              duplicateProfileAcknowledged={duplicateProfileAcknowledged}
              duplicateProfileMatches={duplicateProfileMatches}
              profileTarget={profileTarget}
              selectedParentLookupProfileId={selectedParentLookupProfileId}
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
            selectedParentLookupProfileId={selectedParentLookupProfileId}
            selectedChildSearchProfileId={selectedChildSearchProfileId}
            setConsent={setConsent}
            usesParentIdentity={usesParentIdentity}
          />
        </StagePanel>
      )}
    </>
  )
}

function DraftReviewPurposeCard({
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
  isExplicitMapping,
  legacyAccountSelected,
  lookupState,
  lookupPickerOpen,
  parentPhone,
  parentUpdatePhone = '',
  phone,
  profileTarget,
  selectedParentLookupProfileId,
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
  showMigrationForm,
  showNewAccountForm,
  usesParentIdentity,
}: PurchasePurposeCardProps) {
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const selectedChildSearchProfile = childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId) ?? null
  const selectedSearchParentAccount = selectedChildSearchProfile ? getParentAccountFromChildProfile(selectedChildSearchProfile) : null
  const [draftSelectorOpen, setDraftSelectorOpen] = useState(false)
  const [statusExpanded, setStatusExpanded] = useState(false)
  const parentLookupSelectionReady = Boolean(parentLookupAccount && (profileTarget === 'new' || (profileTarget === 'existing' && selectedParentLookupProfileId)))
  const selectedParentLookupProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId) ?? null
  const hasSelectedTarget = Boolean(selectedChildSearchProfile || parentLookupSelectionReady || showMigrationForm || showNewAccountForm)
  const accountStatusLabel = accountStatus === 'existing' ? 'Sudah punya akun' : accountStatus === 'new' ? 'Belum punya akun' : 'Belum dipilih'
  const selectorTitle = accountStatus === 'existing' ? 'Pilih akun / profil tujuan' : 'Cek nomor Orang Tua'
  const selectorDescription = accountStatus === 'existing' ? 'Cari dengan No. HP atau User Serial.' : 'Pastikan nomor bisa dipakai untuk akun baru.'
  const consentCopy = 'Saya sudah memastikan data Orang Tua, data Anak, dan profil tujuan paket sudah benar, aktif, dan sesuai dengan informasi customer.'

  return (
    <SectionCard className="purpose-card draft-review-purpose" title="Tujuan Akun">
      <div className="draft-review-section account-status-section compact-status-section">
        {hasSelectedTarget && accountStatus && !statusExpanded ? (
          <div className="draft-status-summary-row">
            <div>
              <span>Kondisi akun customer</span>
              <strong>{accountStatusLabel}</strong>
            </div>
            <button type="button" onClick={() => setStatusExpanded(true)}>Ubah</button>
          </div>
        ) : (
          <>
            <div className="draft-review-head">
              <span>Kondisi akun customer</span>
            </div>
            <div className="draft-status-segment" role="group" aria-label="Kondisi akun customer">
              <button
                className={accountStatus === 'existing' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setAccountStatus('existing')
                  setStatusExpanded(false)
                }}
              >
                <span className="segment-copy">
                  <strong>Sudah Punya Akun</strong>
                  <small>Orang tua/anak sudah pernah memiliki akun, ingin renew paket atau berlangganan sebelumnya</small>
                </span>
                <span className="segment-radio" aria-hidden="true" />
              </button>
              <button
                className={accountStatus === 'new' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setAccountStatus('new')
                  setStatusExpanded(false)
                }}
              >
                <span className="segment-copy">
                  <strong>Belum Punya Akun</strong>
                  <small>Orang tua/anak belum pernah memiliki akun atau berlangganan sebelumnya</small>
                </span>
                <span className="segment-radio" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>

      {accountStatus && (
        <div className="draft-review-section account-selector-section">
          <div className="draft-review-head">
            <span>Akun tujuan paket</span>
          </div>
          <AccountTargetSearchTrigger
            className="draft-selector-trigger"
            helper={selectorDescription}
            title={hasSelectedTarget ? 'Ubah akun tujuan' : selectorTitle}
            onClick={() => setDraftSelectorOpen(true)}
          />
          {draftSelectorOpen && (
            <DraftAccountSelectorSheet
              accountStatus={accountStatus}
              checkNumber={(options) => checkNumber({ ...options, preserveSelectedTarget: hasSelectedTarget || options?.preserveSelectedTarget })}
              contactOwner={contactOwner}
              isExplicitMapping={isExplicitMapping}
              legacyAccountSelected={legacyAccountSelected}
              lookupState={lookupState}
              lookupPickerOpen={lookupPickerOpen}
              phone={phone}
              profileTarget={profileTarget}
              selectedParentLookupProfileId={selectedParentLookupProfileId}
              selectedChildSearchProfileId={selectedChildSearchProfileId}
              setAccountStatus={setAccountStatus}
              setContactOwner={setContactOwner}
              setLegacyAccountSelected={setLegacyAccountSelected}
              setLookupState={setLookupState}
              setLookupPickerOpen={setLookupPickerOpen}
              setPhone={setPhone}
              setPackageIntent={setPackageIntent}
              setProfileTarget={setProfileTarget}
              setSelectedChildProfileId={setSelectedChildProfileId}
              setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
              onClose={() => setDraftSelectorOpen(false)}
            />
          )}
        </div>
      )}

      {(selectedSearchParentAccount && selectedChildSearchProfile) && (
        <div className="draft-review-section selected-account-section">
          <div className="draft-selected-account-title">Akun tujuan pembelian paket</div>
          <DraftInvoiceSelectedAccountDetails
            key={selectedSearchParentAccount.serial + '-' + selectedChildSearchProfile.id}
            account={selectedSearchParentAccount}
            matchedValue={phone}
            parentUpdatePhone={parentUpdatePhone}
            profile={selectedChildSearchProfile}
            setParentUpdatePhone={setParentUpdatePhone}
          />
        </div>
      )}

      {parentLookupAccount && parentLookupSelectionReady && (
        <div className="draft-review-section selected-account-section">
          <div className="draft-selected-account-title">Akun tujuan pembelian paket</div>
          {profileTarget === 'existing' && selectedParentLookupProfile ? (
            <DraftInvoiceSelectedAccountDetails
              key={parentLookupAccount.serial + '-' + selectedParentLookupProfile.id}
              account={parentLookupAccount}
              matchedValue={phone}
              parentUpdatePhone={parentUpdatePhone}
              profile={selectedParentLookupProfile}
              setParentUpdatePhone={setParentUpdatePhone}
            />
          ) : (
            <ProfileTargetStage
              account={parentLookupAccount}
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              profileTarget={profileTarget}
              selectedParentLookupProfileId={selectedParentLookupProfileId}
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
          )}
        </div>
      )}

      {showMigrationForm && (
        <div className="draft-review-section selected-account-section">
          <div className="draft-review-head">
            <span>Akun tujuan pembelian paket</span>
            <strong>{childName || existingAccount.name}</strong>
          </div>
          <AccountForm
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            mode="migration"
            migrationIdentityToggle={(
              <MigrationIdentityToggle
                checked={usesParentIdentity}
                onChange={() => setUsesParentIdentity(!usesParentIdentity)}
              />
            )}
            parentPhone={usesParentIdentity ? parentPhone || phone : parentPhone}
            prefilledParentPhone={phone}
            usesParentIdentity={usesParentIdentity}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
            setParentPhone={setParentPhone}
          />
        </div>
      )}

      {showNewAccountForm && (
        <div className="draft-review-section selected-account-section">
          <div className="draft-review-head">
            <span>Akun tujuan pembelian paket</span>
            <strong>{childName || 'Profil Anak baru'}</strong>
          </div>
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
        </div>
      )}
      {hasSelectedTarget && (
        <label className="consent-row review-consent draft-review-consent">
          <input checked={consent} type="checkbox" onChange={(event) => setConsent(event.target.checked)} />
          <span>{consentCopy}</span>
        </label>
      )}
    </SectionCard>
  )
}

type AccountTargetSearchSheetProps = {
  accountStatus: AccountStatus | null
  checkNumber: (options?: LookupCheckOptions) => void
  contactOwner: ContactOwner
  isExplicitMapping: boolean
  legacyAccountSelected: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  phone: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
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
  onClose: () => void
  title?: string
}

function AccountTargetSearchSheet({
  accountStatus,
  checkNumber,
  legacyAccountSelected,
  lookupState,
  phone,
  profileTarget,
  selectedParentLookupProfileId,
  selectedChildSearchProfileId,
  setAccountStatus,
  setLegacyAccountSelected,
  setLookupState,
  setLookupPickerOpen,
  setPhone,
  setPackageIntent,
  setProfileTarget,
  setSelectedChildProfileId,
  setSelectedChildSearchProfileId,
  title,
  onClose,
}: AccountTargetSearchSheetProps) {
  const sheetTitle = title ?? (accountStatus === 'new' ? 'Cek No. HP Orang Tua' : 'Akun yang dipakai untuk login')

  return (
    <BottomSheet className="draft-account-selector-sheet option-five-search-sheet" title={sheetTitle} onClose={onClose}>
      {accountStatus ? (
        <DraftLookupStage
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          inlineResults
          legacyAccountSelected={legacyAccountSelected}
          lookupState={lookupState}
          onTargetSelected={onClose}
          phone={phone}
          profileTarget={profileTarget}
          selectedParentLookupProfileId={selectedParentLookupProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setAccountStatus={setAccountStatus}
          setLegacyAccountSelected={setLegacyAccountSelected}
          setLookupState={setLookupState}
          setLookupPickerOpen={setLookupPickerOpen}
          setPhone={setPhone}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
        />
      ) : (
        <Callout className="lookup-hint">
          <strong>Pilih kondisi customer</strong>
          <p>Pilih Sudah Punya Akun atau Belum Punya Akun untuk menampilkan field pencarian.</p>
        </Callout>
      )}
    </BottomSheet>
  )
}

function DraftAccountSelectorSheet(props: AccountTargetSearchSheetProps) {
  return <AccountTargetSearchSheet {...props} title={props.accountStatus === 'new' ? 'Cek No. HP Orang Tua' : 'Pilih Akun Anak Tujuan'} />
}

function DraftLookupStage({
  accountStatus,
  checkNumber,
  inlineResults = false,
  legacyAccountSelected,
  lookupState,
  onTargetSelected,
  phone,
  profileTarget,
  selectedParentLookupProfileId,
  setAccountStatus,
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
  accountStatus: AccountStatus
  checkNumber: (options?: LookupCheckOptions) => void
  inlineResults?: boolean
  legacyAccountSelected: boolean
  lookupState: LookupState
  onTargetSelected: () => void
  phone: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
  selectedChildSearchProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setLegacyAccountSelected: (value: boolean) => void
  setLookupState: (value: LookupState) => void
  setLookupPickerOpen: (value: boolean) => void
  setPhone: (value: string) => void
  setPackageIntent: (value: PackageIntent) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setSelectedChildSearchProfileId: (value: string) => void
}) {
  const isExistingFlow = accountStatus === 'existing'
  const [checkedLookupValue, setCheckedLookupValue] = useState(phone)
  const matchedLookupValue = checkedLookupValue || phone
  const handleCheckNumber = () => {
    setCheckedLookupValue(phone)
    checkNumber()
  }
  const handleTargetSelected = () => {
    setLookupPickerOpen(false)
    onTargetSelected()
  }
  const handleNoticeAction = (status: AccountStatus) => {
    setLookupPickerOpen(false)
    setAccountStatus(status)
    setLookupState('idle')
  }
  const setLegacyAccountSelectedFromSheet = (value: boolean) => {
    setLegacyAccountSelected(value)
    if (value) handleTargetSelected()
  }
  const setProfileTargetFromSheet = (value: ProfileTarget) => {
    setProfileTarget(value)
    if (value === 'new') handleTargetSelected()
  }
  const setSelectedChildProfileIdFromSheet = (value: string) => {
    setSelectedChildProfileId(value)
    if (value) handleTargetSelected()
  }
  const setSelectedChildSearchProfileIdFromSheet = (value: string) => {
    setSelectedChildSearchProfileId(value)
    if (value) handleTargetSelected()
  }

  return (
    <div className="draft-lookup-stage">
      <div className="lookup-row">
        <input
          value={phone}
          placeholder={isExistingFlow ? 'No. HP / User serial' : 'No. HP Orang Tua'}
          onChange={(event) => setPhone(event.target.value)}
          aria-label={isExistingFlow ? 'No. HP atau User Serial customer' : 'Nomor HP orang tua'}
        />
        <button type="button" onClick={handleCheckNumber}>Cek Akun</button>
      </div>
      {lookupState === 'idle' && (
        <Callout className="lookup-hint">
          <strong>{isExistingFlow ? 'Cari akun tujuan' : 'Cek nomor Orang Tua'}</strong>
          <p>{isExistingFlow ? 'Input No. HP atau User Serial untuk memilih akun tujuan paket.' : 'Input nomor Orang Tua yang akan menerima kredensial Anak.'}</p>
        </Callout>
      )}
      {inlineResults && lookupState === 'existing-old-account-with-child-profile-contact' && (
        <div className="option-five-inline-results">
          <ResultSummaryText childCount={getOldAccountProfileContactMatches(lookupState).length} matchedValue={matchedLookupValue} oldAccountCount={isSerialLookupInput(matchedLookupValue) ? 0 : 1} />
          <OldAccountResolutionResults
            legacyAccountSelected={legacyAccountSelected}
            matchedValue={matchedLookupValue}
            profiles={getOldAccountProfileContactMatches(lookupState)}
            selectedChildSearchProfileId={selectedChildSearchProfileId}
            showLegacyAccount={!isSerialLookupInput(matchedLookupValue)}
            setLegacyAccountSelected={setLegacyAccountSelectedFromSheet}
            setPackageIntent={setPackageIntent}
            setProfileTarget={setProfileTargetFromSheet}
            setSelectedChildProfileId={setSelectedChildProfileIdFromSheet}
            setSelectedChildSearchProfileId={setSelectedChildSearchProfileIdFromSheet}
          />
        </div>
      )}
      {inlineResults && lookupState === 'existing-old-account' && (
        <div className="option-five-inline-results">
          <ResultSummaryText matchedValue={matchedLookupValue} oldAccountCount={1} />
          <OldAccountResolutionResults
            legacyAccountSelected={legacyAccountSelected}
            matchedValue={matchedLookupValue}
            profiles={[]}
            selectedChildSearchProfileId=""
            showLegacyAccount
            setLegacyAccountSelected={setLegacyAccountSelectedFromSheet}
            setPackageIntent={setPackageIntent}
            setProfileTarget={setProfileTargetFromSheet}
            setSelectedChildProfileId={setSelectedChildProfileIdFromSheet}
            setSelectedChildSearchProfileId={setSelectedChildSearchProfileIdFromSheet}
          />
        </div>
      )}


      {inlineResults && (isSearchResolutionLookup(lookupState) || isParentProfileLookup(lookupState)) && (
        <div className="option-five-inline-results">
          <ResultSummaryText childCount={getChildProfileSearchResults(lookupState).length} matchedValue={matchedLookupValue} parentCount={getDirectParentResultCount(lookupState)} />
          <SearchResolutionResults
            lookupState={lookupState}
            matchedValue={matchedLookupValue}
            profileTarget={profileTarget}
            selectedParentLookupProfileId={selectedParentLookupProfileId}
            selectedChildSearchProfileId={selectedChildSearchProfileId}
            setLookupState={setLookupState}
            setPackageIntent={setPackageIntent}
            setProfileTarget={setProfileTargetFromSheet}
            setSelectedChildProfileId={setSelectedChildProfileIdFromSheet}
            setSelectedChildSearchProfileId={setSelectedChildSearchProfileIdFromSheet}
          />
        </div>
      )}

      {isLookupNoticeState(lookupState) && (
        <LookupNoticeInline
          lookupState={lookupState}
          phone={matchedLookupValue}
          onAction={handleNoticeAction}
        />
      )}

    </div>
  )
}

type PurchasePurposeCardProps = {
  accountStatus: AccountStatus | null
  checkNumber: (options?: LookupCheckOptions) => void
  childEmail: string
  childName: string
  childPhone: string
  consent: boolean
  confirmationError?: boolean
  duplicateProfileAcknowledged: boolean
  duplicateProfileMatches: ChildProfile[]
  grade: string
  legacyAccountSelected: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  parentLastLoginAt?: string
  parentLeadStatus?: LeadAssignmentStatus
  parentName: string
  parentPhone: string
  parentUpdateName?: string
  parentUpdatePhone?: string
  phone: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
  selectedChildSearchProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setConsent: (value: boolean) => void
  setConfirmationError?: (value: boolean) => void
  canConfirmPurchase?: boolean
  useEditableInfoList?: boolean
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
  isDraftReview: boolean
  isExplicitMapping: boolean
  isSheetLookup: boolean
  wizardStep: WizardStep
}

type OptionThreeWizardProps = Omit<PurchasePurposeCardProps, 'isBeforeAfterMapping' | 'isDraftReview' | 'isExplicitMapping' | 'isSheetLookup' | 'setUsesParentIdentity' | 'showMigrationForm'>

type StepperState = 'active' | 'done' | 'pending'

type WizardStepperContext = {
  accountStatus: AccountStatus | null
  legacyAccountSelected: boolean
  lookupState: LookupState
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
  selectedChildSearchProfileId: string
  wizardStep: WizardStep
}

function getDynamicWizardSteps({ accountStatus, legacyAccountSelected, lookupState, profileTarget, selectedParentLookupProfileId, selectedChildSearchProfileId }: WizardStepperContext): Array<{ id: WizardStep; label: string }> {
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
    if (profileTarget === 'existing' && selectedParentLookupProfileId) {
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

function WizardLookupStep({ accountStatus, checkNumber, contactOwner, legacyAccountSelected, lookupState, lookupPickerOpen, phone, profileTarget, selectedParentLookupProfileId, selectedChildSearchProfileId, setAccountStatus, setContactOwner, setLegacyAccountSelected, setLookupState, setLookupPickerOpen, setPhone, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId }: {
  accountStatus: AccountStatus | null
  checkNumber: (options?: LookupCheckOptions) => void
  contactOwner: ContactOwner
  legacyAccountSelected: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  phone: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const selectedLookupProfile = (isSearchResolutionLookup(lookupState) || lookupState === 'existing-old-account-with-child-profile-contact')
    ? childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId)
    : undefined
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const selectedParentProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId)
  const hasSelectedTarget = Boolean(legacyAccountSelected || selectedLookupProfile || selectedParentProfile || profileTarget === 'new')
  const selectedTitle = selectedLookupProfile?.name ?? selectedParentProfile?.name ?? (legacyAccountSelected ? existingAccount.name : profileTarget === 'new' ? 'Profil Anak baru' : '')
  const isExistingFlow = accountStatus === 'existing'
  const triggerTitle = isExistingFlow ? 'Pilih profil Anak tujuan' : 'Cek nomor Orang Tua'
  const triggerHelper = hasSelectedTarget
    ? selectedTitle
    : isExistingFlow
      ? 'Cari dengan No. HP atau User Serial.'
      : 'Pastikan nomor bisa dipakai untuk akun baru.'

  return (
    <StagePanel step="STEP 1" title="Cari Customer dan Status Akun">
      <ChoiceCard
        active={accountStatus === 'existing'}
        description="Cari akun atau profil yang akan menjadi tujuan pembelian paket."
        title="Sudah Punya Akun"
        onClick={() => setAccountStatus('existing')}
      />
      <ChoiceCard
        active={accountStatus === 'new'}
        description="Buat data Orang Tua dan Anak baru dari informasi customer."
        title="Belum Punya Akun"
        onClick={() => setAccountStatus('new')}
      />

      {accountStatus && (
        <div className="wizard-lookup-area">
          <AccountTargetSearchTrigger
            className="draft-selector-trigger"
            helper={triggerHelper}
            title={hasSelectedTarget ? 'Ubah akun tujuan' : triggerTitle}
            onClick={() => setSheetOpen(true)}
          />
          {sheetOpen && (
            <AccountTargetSearchSheet
              accountStatus={accountStatus}
              checkNumber={checkNumber}
              contactOwner={contactOwner}
              isExplicitMapping={false}
              legacyAccountSelected={legacyAccountSelected}
              lookupState={lookupState}
              lookupPickerOpen={lookupPickerOpen}
              phone={phone}
              profileTarget={profileTarget}
              selectedParentLookupProfileId={selectedParentLookupProfileId}
              selectedChildSearchProfileId={selectedChildSearchProfileId}
              setAccountStatus={setAccountStatus}
              setContactOwner={setContactOwner}
              setLegacyAccountSelected={setLegacyAccountSelected}
              setLookupState={setLookupState}
              setLookupPickerOpen={setLookupPickerOpen}
              setPhone={setPhone}
              setPackageIntent={setPackageIntent}
              setProfileTarget={setProfileTarget}
              setSelectedChildProfileId={setSelectedChildProfileId}
              setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
              title={accountStatus === 'new' ? 'Cek No. HP Orang Tua' : 'Akun yang dipakai untuk login'}
              onClose={() => setSheetOpen(false)}
            />
          )}
        </div>
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
  const shouldCheckParentPhone = mode === 'new'
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
        <ParentPhoneCheckResult account={parentPhoneAccount} mode={mode} phone={parentPhone} />
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
    <div className="new-child-direct-form">
      <label className="draft-text-field direct-input">
        <span>No. HP</span>
        <input aria-label="No. HP Anak" placeholder="Masukan no. HP anak" value={childPhone} onChange={(event) => setChildPhone(event.target.value)} />
      </label>
      <label className="draft-text-field direct-input">
        <span>Email</span>
        <input aria-label="Email Anak" placeholder="Masukan email anak" value={childEmail} onChange={(event) => setChildEmail(event.target.value)} />
      </label>
      <label className="draft-text-field direct-input">
        <span>Nama</span>
        <input aria-label="Nama Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={(event) => setChildName(event.target.value)} />
      </label>
      <label className="draft-text-field direct-input select-field">
        <span>Kelas</span>
        <div className="draft-select-wrap">
          <select aria-label="Kelas" value={grade} onChange={(event) => setGrade(event.target.value)}>
            <option value="">Pilih kelas</option>
            {GRADE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      </label>
    </div>
  )
}

function WizardReviewStep({ accountStatus, childName, consent, grade, parentAccount, parentName, parentPhone, phone, profileTarget, selectedParentLookupProfileId, selectedChildSearchProfileId, setConsent, usesParentIdentity }: {
  accountStatus: AccountStatus | null
  childName: string
  consent: boolean
  grade: string
  parentAccount: ParentProfileAccount | null
  parentName: string
  parentPhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
  selectedChildSearchProfileId: string
  setConsent: (value: boolean) => void
  usesParentIdentity: boolean
}) {
  const isNewAccount = accountStatus === 'new'
  const selectedProfile = parentAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId)
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
  const totalChildCount = childCount + oldAccountCount
  const parts = [
    formatResultSummaryPart(parentCount, 'Orang Tua'),
    formatResultSummaryPart(totalChildCount, 'Anak'),
  ].filter(Boolean)

  if (parts.length === 0) return null

  return <p className="result-summary-text">{parts.join(', ')} ditemukan dengan {isSerialLookupInput(matchedValue) ? 'user serial' : 'nomor'} <strong>{matchedValue}</strong></p>
}

function SearchResolutionResults({ lookupState, matchedValue, profileTarget, selectedParentLookupProfileId, selectedChildSearchProfileId, setLookupState, setPackageIntent, setProfileTarget, setSelectedChildProfileId, setSelectedChildSearchProfileId }: {
  lookupState: LookupState
  matchedValue: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
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
  const directParentPhone = normalizePhoneDigits(directParentAccount?.phone ?? '')
  const directParentMatchedProfiles = directParentAccount
    ? profileResults.filter((profile) => {
      const profileParentPhone = normalizePhoneDigits(profile.parentPhone ?? '')
      return Boolean(
        profile.parentSerial === directParentAccount.serial
        || (directParentPhone && profileParentPhone === directParentPhone),
      )
    })
    : []
  const directParentOwnProfiles = parentLookupAccount ? getParentAccountChildProfiles(parentLookupAccount) : []
  const directParentProfiles = [
    ...directParentOwnProfiles,
    ...directParentMatchedProfiles.filter((profile) => !directParentOwnProfiles.some((ownProfile) => ownProfile.id === profile.id)),
  ]
  const remainingProfiles = directParentAccount
    ? profileResults.filter((profile) => !directParentProfiles.some((directProfile) => directProfile.id === profile.id))
    : profileResults
  const directActiveChildId = selectedParentLookupProfileId
  const searchActiveChildId = selectedChildSearchProfileId
  const parentGroups = remainingProfiles.reduce<Array<{ leadStatus?: LeadAssignmentStatus; name: string; phone: string; serial?: string; profiles: ChildProfile[] }>>((groups, profile) => {
    const parentPhoneKey = profile.parentPhone ?? 'unknown'
    const existingGroup = groups.find((group) => group.phone === parentPhoneKey)

    if (existingGroup) {
      existingGroup.profiles.push(profile)
      return groups
    }

    return [...groups, { leadStatus: undefined, name: profile.parentName ?? 'Orang Tua', phone: parentPhoneKey, serial: profile.parentSerial, profiles: [profile] }]
  }, [])
  const shouldShowParentBucket = false

  const selectParentAccount = () => {
    if (parentLookupAccount) {
      setProfileTarget('new')
      setSelectedChildProfileId('')
      setSelectedChildSearchProfileId('')
      setPackageIntent(null)
      return
    }

    setLookupState('existing-parent-with-children')
    setProfileTarget('new')
    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId('')
    setPackageIntent(null)
  }

  const selectChildProfile = (profile: ChildProfile, belongsToDirectParent = false) => {
    setProfileTarget('existing')
    setPackageIntent(null)

    if (parentLookupAccount && belongsToDirectParent) {
      setSelectedChildProfileId(profile.id)
      setSelectedChildSearchProfileId('')
      return
    }

    setSelectedChildProfileId('')
    setSelectedChildSearchProfileId(profile.id)
  }

  return (
    <div className="search-resolution">
      {directParentAccount && (
        <div className="resolution-group result-list-shell">
          <span className="resolution-label">Akun Orang Tua</span>
          <div className="resolution-profile-groups grouped">
            <div className="resolution-parent-bucket grouped">
              <ParentBucketHeading leadStatus={directParentAccount.leadStatus} matchedValue={matchedValue} name={directParentAccount.name} phone={directParentAccount.phone} serial={directParentAccount.serial} />
              {directParentProfiles.map((profile) => (
                <ChildTargetCandidateCard
                  active={directActiveChildId === profile.id}
                  key={profile.id}
                  profile={profile}
                  onClick={() => selectChildProfile(profile, true)}
                  hideParentDetail
                  matchedValue={matchedValue}
                />
              ))}
              <NewChildTargetCard active={profileTarget === 'new'} hasProfiles={directParentProfiles.length > 0} onClick={selectParentAccount} />
            </div>
          </div>
        </div>
      )}

      {remainingProfiles.length > 0 && (
        <div className="resolution-group result-list-shell">
          <span className="resolution-label">Akun Anak</span>
          <div className={shouldShowParentBucket ? 'resolution-profile-groups grouped' : 'resolution-profile-groups'}>
            {parentGroups.map((group) => (
              <div className={shouldShowParentBucket ? 'resolution-parent-bucket grouped' : 'resolution-parent-bucket'} key={group.phone}>
                {shouldShowParentBucket && <ParentBucketHeading leadStatus={group.leadStatus} matchedValue={matchedValue} name={group.name} phone={group.phone} serial={group.serial} />}
                {group.profiles.map((profile) => (
                  <ChildTargetCandidateCard
                    active={searchActiveChildId === profile.id}
                    key={profile.id}
                    profile={profile}
                    onClick={() => selectChildProfile(profile)}
                    hideParentDetail={shouldShowParentBucket}
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
function buildPrototypeEmail(name: string, fallback: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, '')
    .trim()
    .replace(/\s+/g, '.')

  return slug ? slug + '@gmail.com' : fallback
}

function buildPrototypeUsername(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, '')
    .trim()
    .replace(/\s+/g, '.')

  return slug || 'username.anak'
}

function DraftDataRow({ initialValue, label, onChange, options, value }: {
  icon?: ReactNode
  initialValue?: string
  label: string
  onChange?: (value: string) => void
  options?: string[]
  value: string
}) {
  const [editing, setEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const [committedValue, setCommittedValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const canEdit = Boolean(onChange)
  const displayValue = committedValue || value
  const originalValue = initialValue ?? value
  const hasChanged = displayValue !== originalValue
  const selectOptions = options && displayValue && !options.includes(displayValue) ? [displayValue, ...options] : options

  useEffect(() => {
    if (!editing) return
    if (options) {
      selectRef.current?.focus()
      return
    }
    inputRef.current?.focus()
    const cursorPosition = inputRef.current?.value.length ?? 0
    inputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
  }, [editing, options])

  const startEditing = () => {
    setDraftValue(displayValue)
    setEditing(true)
  }

  const finishEditing = () => {
    const nextValue = options ? selectRef.current?.value ?? draftValue : inputRef.current?.value ?? draftValue
    setDraftValue(nextValue)
    setCommittedValue(nextValue)
    onChange?.(nextValue)
    setEditing(false)
  }

  const handleTextChange = (nextValue: string) => {
    setDraftValue(nextValue)
    setCommittedValue(nextValue)
    onChange?.(nextValue)
  }

  return (
    <div className="draft-data-row">
      {editing && onChange ? (
        <div className="draft-text-field editing">
          <span className="draft-field-head">
            <span>{label}</span>
            <span className="draft-field-actions">
              <button type="button" onClick={finishEditing}>Selesai</button>
            </span>
          </span>
          {selectOptions ? (
            <div className="draft-select-wrap">
              <select
                ref={selectRef}
                aria-label={label}
                value={draftValue}
                onChange={(event) => {
                  onChange(event.target.value)
                  setDraftValue(event.target.value)
                  setCommittedValue(event.target.value)
                  setEditing(false)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') finishEditing()
                }}
              >
                {selectOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          ) : (
            <input
              ref={inputRef}
              aria-label={label}
              value={draftValue}
              onChange={(event) => handleTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') finishEditing()
              }}
            />
          )}
        </div>
      ) : (
        <div className={hasChanged ? 'draft-text-field readonly changed' : 'draft-text-field readonly'}>
          <span className="draft-field-head">
            <span>{label}</span>
            <span className="draft-field-actions">
              {canEdit && <button type="button" onClick={startEditing}>Edit</button>}
            </span>
          </span>
          <strong>{displayValue || '-'}</strong>
        </div>
      )}
    </div>
  )
}

function EditableInfoListRow({ initialValue, label, onChange, options, placeholder = '-', value }: {
  initialValue?: string
  label: string
  onChange?: (value: string) => void
  options?: string[]
  placeholder?: string
  value: string
}) {
  const [editing, setEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const [committedValue, setCommittedValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const canEdit = Boolean(onChange)
  const displayValue = committedValue || value
  const displayText = displayValue || placeholder
  const originalValue = initialValue ?? value
  const hasChanged = Boolean(displayValue) && displayValue !== originalValue
  const selectOptions = options && displayValue && !options.includes(displayValue) ? [displayValue, ...options] : options

  useEffect(() => {
    if (!editing) return
    if (options) {
      selectRef.current?.focus()
      return
    }

    inputRef.current?.focus()
    const cursorPosition = inputRef.current?.value.length ?? 0
    inputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
  }, [editing, options])

  const finishEditing = () => {
    const nextValue = options ? selectRef.current?.value ?? draftValue : inputRef.current?.value ?? draftValue
    setDraftValue(nextValue)
    setCommittedValue(nextValue)
    onChange?.(nextValue)
    setEditing(false)
  }

  const handleTextChange = (nextValue: string) => {
    setDraftValue(nextValue)
    setCommittedValue(nextValue)
    onChange?.(nextValue)
  }

  const editor = editing && onChange ? (
    <div className="editable-info-editor">
      {selectOptions ? (
        <div className="editable-info-select-wrap">
          <select
            ref={selectRef}
            aria-label={label}
            value={draftValue}
            onChange={(event) => {
              onChange(event.target.value)
              setDraftValue(event.target.value)
              setCommittedValue(event.target.value)
              setEditing(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') finishEditing()
            }}
          >
            {!draftValue && <option value="" disabled>{placeholder}</option>}
            {selectOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </div>
      ) : (
        <input
          ref={inputRef}
          aria-label={label}
          value={draftValue}
          onChange={(event) => handleTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') finishEditing()
          }}
        />
      )}
    </div>
  ) : null

  return (
    <div className={[hasChanged ? 'editable-info-row changed' : 'editable-info-row', !displayValue ? 'empty' : '', editing ? 'editing' : ''].filter(Boolean).join(' ')}>
      <div className="editable-info-line">
        <span>{label}</span>
        <strong className={!displayValue ? 'editable-info-placeholder' : undefined}>{displayText}</strong>
        {canEdit && (
          <button type="button" aria-label={editing ? 'Selesai edit ' + label : 'Edit ' + label} onClick={() => editing ? finishEditing() : setEditing(true)}>
            {editing ? <Check size={18} /> : <Pencil size={18} />}
          </button>
        )}
      </div>
      {editor}
    </div>
  )
}

function InfoListStaticRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="editable-info-row static">
      <div className="editable-info-line">
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  )
}

function DraftInvoiceSelectedAccountDetails({ account, changeTargetAction, layout = 'card', matchedValue, parentUpdatePhone, profile, setParentUpdatePhone }: {
  account: ParentProfileAccount
  changeTargetAction?: ReactNode
  layout?: 'card' | 'info-list'
  matchedValue?: string
  parentUpdatePhone: string
  profile: ChildProfile
  setParentUpdatePhone: (value: string) => void
}) {
  const [childPhone, setChildPhone] = useState(profile.contact ?? '')
  const [childEmail, setChildEmail] = useState(buildPrototypeEmail(profile.name, 'email.anak@gmail.com'))
  const [childName, setChildName] = useState(profile.name)
  const [childGrade, setChildGrade] = useState(profile.grade)
  const initialChildPhone = profile.contact ?? ''
  const initialChildEmail = buildPrototypeEmail(profile.name, 'email.anak@gmail.com')
  const initialChildName = profile.name
  const initialChildGrade = profile.grade
  const parentPhoneValue = parentUpdatePhone || account.phone
  const parentEmail = buildPrototypeEmail(account.name, 'email.orangtua@gmail.com')
  const parentUpdateState = getParentUpdateState(account, account.name, parentPhoneValue)
  const latestPackage = getLatestPackageName(profile)
  const changeItems = [
    { label: 'No. HP Anak', before: initialChildPhone, after: childPhone },
    { label: 'Email Anak', before: initialChildEmail, after: childEmail },
    { label: 'Nama Anak', before: initialChildName, after: childName },
    { label: 'Kelas Anak', before: initialChildGrade, after: childGrade },
    { label: 'No. HP Orang Tua', before: account.phone, after: parentPhoneValue },
  ].filter((item) => item.before !== item.after)

  if (layout === 'info-list') {
    return (
      <div className="draft-selected-account-detail option-six-info-list-detail">
        <section className="draft-selected-person child" aria-label="Data Anak">
          <div className="option-six-person-heading">
            <div>
              <h4>Data Anak</h4>
              <strong>{childName}</strong>
              <LeadStatusBadge status={profile.leadStatus} />
            </div>
            {changeTargetAction && <div className="option-six-person-action">{changeTargetAction}</div>}
          </div>
          <div className="editable-info-list">
            <EditableInfoListRow initialValue={initialChildPhone} label="No. HP Anak" value={childPhone} onChange={setChildPhone} />
            <EditableInfoListRow initialValue={initialChildEmail} label="Email Anak" value={childEmail} onChange={setChildEmail} />
            <EditableInfoListRow initialValue={initialChildName} label="Nama Anak" value={childName} onChange={setChildName} />
            <EditableInfoListRow initialValue={initialChildGrade} label="Kelas Anak" options={GRADE_OPTIONS} value={childGrade} onChange={setChildGrade} />
            <InfoListStaticRow label="Serial Number Anak">SN {profile.serial}</InfoListStaticRow>
            <InfoListStaticRow label="Username Anak">{buildPrototypeUsername(childName)}</InfoListStaticRow>
          </div>
          {latestPackage && (
            <div className="draft-active-package">
              <span>Pembelian terakhir - {getLatestPurchaseDate(profile)}</span>
              <div>
                <strong>{latestPackage}</strong>
              </div>
            </div>
          )}
        </section>

        <section className="draft-selected-person parent" aria-label="Data Orang Tua">
          <div className="option-six-person-heading">
            <div>
              <h4>Data Orang Tua</h4>
              <strong>{account.name}</strong>
              <LeadStatusBadge status={account.leadStatus} />
            </div>
          </div>
          <div className="editable-info-list">
            <EditableInfoListRow initialValue={account.phone} label="No. HP Orang Tua" value={parentPhoneValue} onChange={setParentUpdatePhone} />
            <InfoListStaticRow label="Email Orang Tua">{parentEmail}</InfoListStaticRow>
            <InfoListStaticRow label="Serial Number Orang Tua">SN {account.serial}</InfoListStaticRow>
          </div>
          {parentUpdateState.registeredToOtherParent && parentUpdateState.registeredAccount ? (
            <Callout variant="danger">
              <strong>Nomor dipakai Orang Tua lain</strong>
              <p>No. HP {parentUpdateState.nextPhone} sudah terdaftar sebagai akun Orang Tua {parentUpdateState.registeredAccount.name}.</p>
            </Callout>
          ) : parentUpdateState.phoneChanged ? (
            <Callout variant="warning">
              <strong>No. HP Orang Tua berubah</strong>
              <p>Pastikan nomor yang diisi adalah nomor Orang Tua yang benar dan aktif.</p>
            </Callout>
          ) : null}
        </section>
        {changeItems.length > 0 && <DraftFloatingChangeSummary items={changeItems} />}
      </div>
    )
  }

  return (
    <div className="draft-selected-account-detail">
      <section className="draft-selected-person child" aria-label="Data Anak">
        <SelectedPackageTargetHero action={changeTargetAction} title={childName} />
        <h4 className="draft-data-subtitle">Data Anak</h4>
        <div className="draft-data-grid">
          <DraftDataRow icon={<Phone size={15} />} initialValue={initialChildPhone} label="No. HP Anak" value={childPhone} onChange={setChildPhone} />
          <DraftDataRow icon={<Mail size={15} />} initialValue={initialChildEmail} label="Email Anak" value={childEmail} onChange={setChildEmail} />
          <DraftDataRow initialValue={initialChildName} label="Nama Anak" value={childName} onChange={setChildName} />
          <DraftDataRow initialValue={initialChildGrade} label="Kelas Anak" options={GRADE_OPTIONS} value={childGrade} onChange={setChildGrade} />
          <div className="draft-access-note">
            <span>Serial Number</span>
            <strong><UserSerial match={matchedValue} value={profile.serial} /></strong>
          </div>
          <div className="draft-access-note">
            <span>Username</span>
            <strong>{buildPrototypeUsername(childName)}</strong>
          </div>
        </div>
        <div className="draft-status-line">
          <LeadStatusBadge status={profile.leadStatus} />
        </div>
        {latestPackage && (
          <div className="draft-active-package">
            <span>Pembelian terakhir - {getLatestPurchaseDate(profile)}</span>
            <div>
              <strong>{latestPackage}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="draft-selected-person parent" aria-label="Data Orang Tua">
        <div className="draft-parent-head">
          <div>
            <span>Data Orang Tua</span>
            <strong>{account.name}</strong>
          </div>
        </div>
        <div className="draft-data-grid">
          <DraftDataRow icon={<Phone size={15} />} initialValue={account.phone} label="No. HP Orang Tua" value={parentPhoneValue} onChange={setParentUpdatePhone} />
          <DraftDataRow label="Email" value={parentEmail} />
        </div>
        <div className="draft-access-note parent-serial-line">
          <span>Serial Number</span>
          <strong><UserSerial match={matchedValue} value={account.serial} /></strong>
        </div>
        <div className="draft-status-line parent-status-line">
          <LeadStatusBadge status={account.leadStatus} />
        </div>
        {parentUpdateState.registeredToOtherParent && parentUpdateState.registeredAccount ? (
          <Callout variant="danger">
            <strong>Nomor dipakai Orang Tua lain</strong>
            <p>No. HP {parentUpdateState.nextPhone} sudah terdaftar sebagai akun Orang Tua {parentUpdateState.registeredAccount.name}.</p>
          </Callout>
        ) : parentUpdateState.phoneChanged ? (
          <Callout variant="warning">
            <strong>No. HP Orang Tua berubah</strong>
            <p>Pastikan nomor yang diisi adalah nomor Orang Tua yang benar dan aktif.</p>
          </Callout>
        ) : null}
      </section>
      {changeItems.length > 0 && <DraftFloatingChangeSummary items={changeItems} />}
    </div>
  )
}

function DraftFloatingChangeSummary({ items }: { items: Array<{ label: string; before: string; after: string }> }) {
  const [open, setOpen] = useState(false)

  return (
    <section className={open ? 'draft-floating-change-summary open' : 'draft-floating-change-summary'} aria-label="Catatan perubahan">
      <button className="draft-change-summary-trigger" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Info size={14} />
        <span>Agen mengubah data ({items.length})</span>
      </button>
      <div className="draft-floating-change-popover" role="tooltip">
        <strong>Data yang diperbarui</strong>
        <ul>
          {items.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <small>{item.before || '-'} -&gt; {item.after || '-'}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}


function OptionFiveLegacyChildDetails({ changeTargetAction, childEmail, childName, childPhone, grade, layout = 'card', matchedValue, setChildEmail, setChildName, setChildPhone, setGrade }: {
  changeTargetAction: ReactNode
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  layout?: 'card' | 'info-list'
  matchedValue?: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
}) {
  const initialChildName = existingAccount.name
  const initialChildPhone = existingAccount.phone
  const initialChildEmail = existingAccount.email
  const initialChildGrade = existingAccount.grade
  const childNameValue = childName || initialChildName
  const childGradeValue = grade || initialChildGrade
  const childPhoneValue = childPhone || initialChildPhone
  const childEmailValue = childEmail || initialChildEmail
  const changeItems = [
    { label: 'No. HP Anak', before: initialChildPhone, after: childPhoneValue },
    { label: 'Email Anak', before: initialChildEmail, after: childEmailValue },
    { label: 'Nama Anak', before: initialChildName, after: childNameValue },
    { label: 'Kelas Anak', before: initialChildGrade, after: childGradeValue },
  ].filter((item) => item.before !== item.after && item.after)
  const parentNameValue = existingAccount.parentName
  const parentPhoneValue = existingAccount.parentPhone
  const hasParentInfo = Boolean(parentNameValue || parentPhoneValue)

  if (layout === 'info-list') {
    return (
      <div className="draft-selected-account-detail option-six-info-list-detail option-six-legacy-child-detail">
        <section className="draft-selected-person child" aria-label="Data Anak">
          <div className="option-six-person-heading">
            <div>
              <h4>Data Anak</h4>
              <strong>{childNameValue}</strong>
              <LeadStatusBadge status={existingAccount.leadStatus} />
            </div>
            {changeTargetAction && <div className="option-six-person-action">{changeTargetAction}</div>}
          </div>
          <div className="editable-info-list">
            <EditableInfoListRow initialValue={initialChildPhone} label="No. HP Anak" value={childPhoneValue} onChange={setChildPhone} />
            <EditableInfoListRow initialValue={initialChildEmail} label="Email Anak" value={childEmailValue} onChange={setChildEmail} />
            <EditableInfoListRow initialValue={initialChildName} label="Nama Anak" value={childNameValue} onChange={setChildName} />
            <EditableInfoListRow initialValue={initialChildGrade} label="Kelas Anak" options={GRADE_OPTIONS} value={childGradeValue} onChange={setGrade} />
            <InfoListStaticRow label="Serial Number Anak">SN {existingAccount.serial}</InfoListStaticRow>
            <InfoListStaticRow label="Username Anak">{buildPrototypeUsername(childNameValue)}</InfoListStaticRow>
          </div>
        </section>

        {hasParentInfo && (
          <section className="draft-selected-person parent" aria-label="Data Orang Tua">
            <div className="option-six-person-heading">
              <div>
                <h4>Data Orang Tua</h4>
                <strong>{parentNameValue || 'Orang Tua'}</strong>
              </div>
            </div>
            <div className="editable-info-list">
              {parentPhoneValue && <InfoListStaticRow label="No. HP Orang Tua">{parentPhoneValue}</InfoListStaticRow>}
            </div>
          </section>
        )}
        {changeItems.length > 0 && <DraftFloatingChangeSummary items={changeItems} />}
      </div>
    )
  }

  return (
    <div className="draft-selected-account-detail option-five-legacy-child-detail">
      <section className="draft-selected-person child" aria-label="Data Anak">
        <SelectedPackageTargetHero action={changeTargetAction} title={childNameValue} />
        <h4 className="draft-data-subtitle">Data Anak</h4>
        <div className="draft-data-grid">
          <DraftDataRow icon={<Phone size={15} />} initialValue={initialChildPhone} label="No. HP Anak" value={childPhoneValue} onChange={setChildPhone} />
          <DraftDataRow icon={<Mail size={15} />} initialValue={initialChildEmail} label="Email Anak" value={childEmailValue} onChange={setChildEmail} />
          <DraftDataRow initialValue={initialChildName} label="Nama Anak" value={childNameValue} onChange={setChildName} />
          <DraftDataRow initialValue={initialChildGrade} label="Kelas Anak" options={GRADE_OPTIONS} value={childGradeValue} onChange={setGrade} />
          <div className="draft-access-note">
            <span>Serial Number</span>
            <strong><UserSerial match={matchedValue} value={existingAccount.serial} /></strong>
          </div>
          <div className="draft-access-note">
            <span>Username</span>
            <strong>{buildPrototypeUsername(childNameValue)}</strong>
          </div>
          <LeadStatusBadge status={existingAccount.leadStatus} />
        </div>
      </section>
      {changeItems.length > 0 && <DraftFloatingChangeSummary items={changeItems} />}
    </div>
  )
}

function OptionFiveNewChildDetails({ account, changeTargetAction, childEmail, childName, childPhone, duplicateProfileAcknowledged, duplicateProfileMatches, grade, layout = 'card', parentUpdateName = '', parentUpdatePhone = '', setChildEmail, setChildName, setChildPhone, setDuplicateProfileAcknowledged, setGrade, setParentUpdatePhone, setProfileTarget, setSelectedChildProfileId }: {
  account: ParentProfileAccount
  changeTargetAction: ReactNode
  childEmail: string
  childName: string
  childPhone: string
  duplicateProfileAcknowledged: boolean
  duplicateProfileMatches: ChildProfile[]
  grade: string
  layout?: 'card' | 'info-list'
  parentUpdateName?: string
  parentUpdatePhone?: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setDuplicateProfileAcknowledged: (value: boolean) => void
  setGrade: (value: string) => void
  setParentUpdatePhone: (value: string) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
}) {
  const parentPhoneValue = parentUpdatePhone || account.phone
  const parentEmail = buildPrototypeEmail(account.name, 'email.orangtua@gmail.com')
  const parentUpdateState = getParentUpdateState(account, parentUpdateName, parentPhoneValue)
  const selectExistingProfile = (profile: ChildProfile) => {
    setProfileTarget('existing')
    setSelectedChildProfileId(profile.id)
    setDuplicateProfileAcknowledged(false)
  }

  if (layout === 'info-list') {
    return (
      <div className="draft-selected-account-detail option-six-info-list-detail option-six-new-child-detail">
        <section className="draft-selected-person child" aria-label="Data Anak Baru">
          <div className="option-six-person-heading">
            <div>
              <h4>Lengkapi Data Anak</h4>
              <strong>Anak Baru</strong>
            </div>
            {changeTargetAction && <div className="option-six-person-action">{changeTargetAction}</div>}
          </div>
          <div className="editable-info-list">
            <EditableInfoListRow label="No. HP Anak" placeholder="Masukan nomor HP anak" value={childPhone} onChange={setChildPhone} />
            <EditableInfoListRow label="Email Anak" placeholder="Masukan email anak" value={childEmail} onChange={setChildEmail} />
            <EditableInfoListRow label="Nama Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
            <EditableInfoListRow label="Kelas Anak" options={GRADE_OPTIONS} placeholder="Pilih kelas anak" value={grade} onChange={setGrade} />
          </div>
          <DuplicateProfileWarning
            acknowledged={duplicateProfileAcknowledged}
            matches={duplicateProfileMatches}
            onAcknowledge={() => setDuplicateProfileAcknowledged(true)}
            onUseProfile={selectExistingProfile}
          />
        </section>

        <section className="draft-selected-person parent" aria-label="Data Orang Tua">
          <div className="option-six-person-heading">
            <div>
              <h4>Data Orang Tua</h4>
              <strong>{account.name}</strong>
              <LeadStatusBadge status={account.leadStatus} />
            </div>
          </div>
          <div className="editable-info-list">
            <EditableInfoListRow initialValue={account.phone} label="No. HP Orang Tua" value={parentPhoneValue} onChange={setParentUpdatePhone} />
            <InfoListStaticRow label="Email Orang Tua">{parentEmail}</InfoListStaticRow>
            <InfoListStaticRow label="Serial Number Orang Tua">SN {account.serial}</InfoListStaticRow>
          </div>
          {parentUpdateState.registeredToOtherParent && parentUpdateState.registeredAccount ? (
            <Callout variant="danger">
              <strong>Nomor dipakai Orang Tua lain</strong>
              <p>No. HP {parentUpdateState.nextPhone} sudah terdaftar sebagai akun Orang Tua {parentUpdateState.registeredAccount.name}.</p>
            </Callout>
          ) : parentUpdateState.phoneChanged ? (
            <Callout variant="warning">
              <strong>No. HP Orang Tua berubah</strong>
              <p>Pastikan nomor yang diisi adalah nomor Orang Tua yang benar dan aktif.</p>
            </Callout>
          ) : null}
        </section>
      </div>
    )
  }

  return (
    <div className="draft-selected-account-detail option-five-new-child-detail">
      <section className="draft-selected-person child" aria-label="Data Anak Baru">
        <SelectedPackageTargetHero action={changeTargetAction} title="Anak Baru" />
        <h4 className="draft-data-subtitle">Lengkapi Data Anak</h4>
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
      </section>

      <section className="draft-selected-person parent" aria-label="Data Orang Tua">
        <div className="draft-parent-head">
          <div>
            <span>Data Orang Tua</span>
            <strong>{account.name}</strong>
          </div>
        </div>
        <div className="draft-data-grid">
          <DraftDataRow initialValue={account.phone} label="No. HP Orang Tua" value={parentPhoneValue} onChange={setParentUpdatePhone} />
          <DraftDataRow label="Email" value={parentEmail} />
        </div>
        <div className="draft-access-note parent-serial-line">
          <span>Serial Number</span>
          <strong><UserSerial value={account.serial} /></strong>
        </div>
        <div className="draft-status-line parent-status-line">
          <LeadStatusBadge status={account.leadStatus} />
        </div>
        {parentUpdateState.registeredToOtherParent && parentUpdateState.registeredAccount ? (
          <Callout variant="danger">
            <strong>Nomor dipakai Orang Tua lain</strong>
            <p>No. HP {parentUpdateState.nextPhone} sudah terdaftar sebagai akun Orang Tua {parentUpdateState.registeredAccount.name}.</p>
          </Callout>
        ) : parentUpdateState.phoneChanged ? (
          <Callout variant="warning">
            <strong>No. HP Orang Tua berubah</strong>
            <p>Pastikan nomor yang diisi adalah nomor Orang Tua yang benar dan aktif.</p>
          </Callout>
        ) : null}
      </section>
    </div>
  )
}

function ProfileTargetStage({ account, childEmail, childName, childPhone, duplicateProfileAcknowledged, duplicateProfileMatches, grade, parentUpdateName = '', parentUpdatePhone = '', profileTarget, selectedParentLookupProfileId, setChildEmail, setChildName, setChildPhone, setDuplicateProfileAcknowledged, setGrade, setPackageIntent, setParentUpdatePhone, setProfileTarget, setSelectedChildProfileId }: {
  account: ParentProfileAccount
  childEmail: string
  childName: string
  childPhone: string
  duplicateProfileAcknowledged: boolean
  duplicateProfileMatches: ChildProfile[]
  grade: string
  parentUpdateName?: string
  parentUpdatePhone?: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
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
  const selectedProfile = account.profiles.find((profile) => profile.id === selectedParentLookupProfileId)
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
            <ParentBucketHeading leadStatus={account.leadStatus} name={account.name} phone={account.phone} serial={account.serial} />
            {account.profiles.map((profile) => (
              <ChildTargetCandidateCard
                active={profileTarget === 'existing' && selectedParentLookupProfileId === profile.id}
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
        <div className="draft-selected-person child new-profile-inline">
          <h4 className="draft-data-subtitle">Data Anak Baru</h4>
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

function ParentIdentityBlock({ leadStatus, lastLoginAt, matchedValue, name, phone, serial, showStatus = true }: { leadStatus?: LeadAssignmentStatus; lastLoginAt?: string; matchedValue?: string; name: string; phone: string; serial?: string; showStatus?: boolean }) {
  const resolvedLeadStatus = getParentLeadStatus({ leadStatus, name, phone, serial })
  const resolvedLastLoginAt = getParentLastLoginAt({ lastLoginAt, name, phone, serial })

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
      {showStatus && (
        <div className="relation-status-row parent-status-row">
          <LeadStatusBadge status={resolvedLeadStatus} />
          <LastLoginLine value={resolvedLastLoginAt} />
        </div>
      )}
    </div>
  )
}

function LeadStatusBadge({ status = 'no-lead' }: { status?: LeadAssignmentStatus }) {
  const copy: Record<LeadAssignmentStatus, { label: string; text: string }> = {
    'assigned-to-me': { label: 'Lead ditugaskan ke kamu', text: 'Lead sudah ditugaskan ke kamu' },
    'no-lead': { label: 'Lead belum ditugaskan', text: 'Belum ditugaskan ke agent' },
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
        {profile.grade && <span className="inline-grade">{profile.grade}</span>}
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

function AccountRelationCard({ active = false, matchedValue, mode, onClick, parentLastLoginAt, parentLeadStatus, parentName, parentPhone, parentSerial, profile, profiles = [], showNestedParent = true, showParentStatus = true }: {
  active?: boolean
  matchedValue?: string
  mode: 'parent-first' | 'child-first' | 'selected'
  onClick?: () => void
  parentLastLoginAt?: string
  parentLeadStatus?: LeadAssignmentStatus
  parentName: string
  parentPhone: string
  parentSerial?: string
  profile?: ChildProfile
  profiles?: ChildProfile[]
  showNestedParent?: boolean
  showParentStatus?: boolean
}) {
  const className = ['account-relation-card', mode, active ? 'active' : '', onClick ? 'interactive' : ''].filter(Boolean).join(' ')
  const body = (
    <>
      {(mode === 'parent-first' || mode === 'selected') && (
        <ParentIdentityBlock leadStatus={parentLeadStatus} lastLoginAt={parentLastLoginAt} matchedValue={matchedValue} name={parentName} phone={parentPhone} serial={parentSerial} showStatus={showParentStatus} />
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
          <ParentIdentityBlock leadStatus={parentLeadStatus} lastLoginAt={parentLastLoginAt} matchedValue={matchedValue} name={parentName} phone={parentPhone} serial={parentSerial} showStatus={showParentStatus} />
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
      <div className="draft-status-line parent-status-line">
        <LeadStatusBadge status={updateState.accountLeadStatus} />
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
function ParentBucketHeading({ leadStatus, lastLoginAt, matchedValue, name, phone, serial }: { leadStatus?: LeadAssignmentStatus; lastLoginAt?: string; matchedValue?: string; name: string; phone: string; serial?: string }) {
  return (
    <div className="resolution-parent-heading">
      <ParentIdentityBlock leadStatus={leadStatus} lastLoginAt={lastLoginAt} matchedValue={matchedValue} name={name} phone={phone} serial={serial} />
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
function NewChildTargetCard({ active, onClick }: { active: boolean; hasProfiles: boolean; onClick: () => void }) {
  const className = ['account-relation-card', 'child-first', 'new-child-target', 'interactive', active ? 'active' : ''].filter(Boolean).join(' ')

  return (
    <button className={className} type="button" aria-pressed={active} onClick={onClick}>
      <div className="relation-identity child">
        <div className="relation-title-row">
          <span className="identity-badge child">Anak</span>
          <strong>Tambah Anak Baru</strong>
        </div>
        <div className="new-child-warning-alert compact">
          <Info size={13} />
          <span>Tidak untuk renewal. Pastikan Anak belum ada di daftar.</span>
        </div>
      </div>
      <span className="profile-radio" aria-hidden="true" />
    </button>
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
  isExplicitMapping,
  legacyAccountSelected,
  lookupState,
  lookupPickerOpen,
  phone,
  profileTarget,
  selectedParentLookupProfileId,
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
  checkNumber: (options?: LookupCheckOptions) => void
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  legacyAccountSelected: boolean
  lookupState: LookupState
  lookupPickerOpen: boolean
  phone: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
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
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!accountStatus) {
    return (
      <StagePanel className="divided muted-stage" step="TAHAP 2" title="Pilih status akun terlebih dahulu">
        <Callout className="lookup-hint">
          <strong>Arahan untuk Agent</strong>
          <p>Pilih status customer agar field pencarian yang sesuai bisa ditampilkan.</p>
        </Callout>
      </StagePanel>
    )
  }

  const isExistingFlow = accountStatus === 'existing'
  const title = isExistingFlow ? 'Cari Akun / Profil Ruangguru Saat Ini' : 'Masukkan no. HP Orang Tua'
  const selectedLookupProfile = (isSearchResolutionLookup(lookupState) || lookupState === 'existing-old-account-with-child-profile-contact')
    ? childProfileSearchResults.find((profile) => profile.id === selectedChildSearchProfileId)
    : undefined
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const selectedParentProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId)
  const hasSelectedTarget = Boolean(legacyAccountSelected || selectedLookupProfile || selectedParentProfile || profileTarget === 'new')
  const selectedTitle = selectedLookupProfile?.name ?? selectedParentProfile?.name ?? (legacyAccountSelected ? existingAccount.name : profileTarget === 'new' ? 'Profil Anak baru' : '')
  const helper = hasSelectedTarget
    ? selectedTitle
    : isExistingFlow
      ? 'Cari dengan No. HP atau User Serial.'
      : 'Pastikan nomor bisa dipakai untuk akun baru.'

  return (
    <StagePanel className="divided" step="TAHAP 2" title={title}>
      <AccountTargetSearchTrigger
        className="draft-selector-trigger"
        helper={helper}
        title={hasSelectedTarget ? 'Ubah akun tujuan' : isExistingFlow ? 'Pilih profil Anak tujuan' : 'Cek nomor Orang Tua'}
        onClick={() => setSheetOpen(true)}
      />
      {sheetOpen && (
        <AccountTargetSearchSheet
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          contactOwner={contactOwner}
          isExplicitMapping={isExplicitMapping}
          legacyAccountSelected={legacyAccountSelected}
          lookupState={lookupState}
          lookupPickerOpen={lookupPickerOpen}
          phone={phone}
          profileTarget={profileTarget}
          selectedParentLookupProfileId={selectedParentLookupProfileId}
          selectedChildSearchProfileId={selectedChildSearchProfileId}
          setAccountStatus={setAccountStatus}
          setContactOwner={setContactOwner}
          setLegacyAccountSelected={setLegacyAccountSelected}
          setLookupState={setLookupState}
          setLookupPickerOpen={setLookupPickerOpen}
          setPhone={setPhone}
          setPackageIntent={setPackageIntent}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setSelectedChildSearchProfileId={setSelectedChildSearchProfileId}
          title={accountStatus === 'new' ? 'Cek No. HP Orang Tua' : 'Akun yang dipakai untuk login'}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </StagePanel>
  )
}


function LegacyAccountCandidateCard({ active = false, matchedValue, onClick }: { active?: boolean; matchedValue: string; onClick?: () => void }) {
  const matchedPhone = normalizePhoneDigits(matchedValue)
  const hasParentInfo = Boolean(existingAccount.parentName || existingAccount.parentPhone)
  const profile: ChildProfile = {
    contact: isSerialLookupInput(matchedValue) ? existingAccount.phone : matchedPhone || existingAccount.phone,
    grade: existingAccount.grade,
    id: 'existing-account-as-child',
    leadStatus: existingAccount.leadStatus,
    lastLoginAt: existingAccount.lastLoginAt,
    name: existingAccount.name,
    parentName: existingAccount.parentName,
    parentPhone: existingAccount.parentPhone,
    serial: existingAccount.serial,
  }

  return (
    <AccountRelationCard
      active={active}
      matchedValue={matchedValue}
      mode="child-first"
      parentName={existingAccount.parentName || 'Orang Tua'}
      parentPhone={existingAccount.parentPhone || '-'}
      profile={profile}
      showNestedParent={hasParentInfo}
      showParentStatus={false}
      onClick={onClick}
    />
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
        {(showLegacyAccount || profiles.length > 0) && (
          <div className="resolution-group result-list-shell">
            <span className="resolution-label">Akun Anak</span>
            <div className="resolution-profile-groups">
              {showLegacyAccount && (
                <LegacyAccountCandidateCard active={legacyAccountSelected} matchedValue={matchedValue} onClick={selectLegacyAccount} />
              )}
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

function LookupNoticeInline({ lookupState, onAction, phone }: { lookupState: LookupState; onAction: (value: AccountStatus) => void; phone: string }) {
  const copy = getLookupNoticeCopy(lookupState, phone)
  const registeredAccount = lookupState === 'new-registered' && !isSerialLookupInput(phone) ? getRegisteredParentAccount(phone) : null

  return (
    <div className="lookup-notice-inline">
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
          leadStatus={registeredAccount.leadStatus}
          lastLoginAt={registeredAccount.lastLoginAt}
          statusLabel="Akun terdaftar"
        />
      )}
      {copy.actionLabel && copy.nextStatus && (
        <button className="lookup-notice-action" type="button" onClick={() => onAction(copy.nextStatus)}>{copy.actionLabel}</button>
      )}
    </div>
  )
}

function AccountResult({ description, label = 'Akun', lastLoginAt, leadStatus, name, phone, serial, statusLabel }: { description?: string; label?: string; lastLoginAt?: string; leadStatus?: LeadAssignmentStatus; name: string; phone: string; serial?: string; statusLabel?: string }) {
  const showParentStatus = Boolean(leadStatus || lastLoginAt)

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
        {showParentStatus && (
          <div className="relation-status-row parent-status-row">
            <LeadStatusBadge status={leadStatus} />
            <LastLoginLine value={lastLoginAt} />
          </div>
        )}
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

function OptionSixNewAccountDetails({ childEmail, childName, childPhone, grade, parentPhone, setChildEmail, setChildName, setChildPhone, setGrade, setParentPhone }: {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  parentPhone: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
  setParentPhone: (value: string) => void
}) {
  const parentPhoneAccount = canCheckParentPhone(parentPhone) ? getRegisteredParentAccount(parentPhone) : null
  const parentPhoneIsAvailable = canCheckParentPhone(parentPhone) && !parentPhoneAccount

  return (
    <div className="draft-selected-account-detail option-six-info-list-detail option-six-new-account-detail">
      <section className="draft-selected-person parent" aria-label="Data Orang Tua Baru">
        <h4 className="draft-data-subtitle">Data Orang Tua</h4>
        <div className="editable-info-list">
          <EditableInfoListRow label="No. HP Orang Tua" placeholder="Masukan nomor HP orang tua" value={parentPhone} onChange={setParentPhone} />
        </div>
        {canCheckParentPhone(parentPhone) && <ParentPhoneCheckResult account={parentPhoneAccount} mode="new" phone={parentPhone} />}
      </section>

      {parentPhoneIsAvailable && (
        <section className="draft-selected-person child" aria-label="Data Anak Baru">
          <h4 className="draft-data-subtitle">Lengkapi Data Anak</h4>
          <div className="editable-info-list">
            <EditableInfoListRow label="No. HP Anak" placeholder="Masukan nomor HP anak" value={childPhone} onChange={setChildPhone} />
            <EditableInfoListRow label="Email Anak" placeholder="Masukan email anak" value={childEmail} onChange={setChildEmail} />
            <EditableInfoListRow label="Nama Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
            <EditableInfoListRow label="Kelas Anak" options={GRADE_OPTIONS} placeholder="Pilih kelas anak" value={grade} onChange={setGrade} />
          </div>
        </section>
      )}
    </div>
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
  const shouldCheckParentPhone = mode === 'new'
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
        <ParentPhoneCheckResult account={parentPhoneAccount} mode={mode} phone={parentPhone} />
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
    </div>
  )
}

function ParentPhoneCheckResult({ account, mode, phone }: { account: ReturnType<typeof getRegisteredParentAccount>; mode: 'migration' | 'new'; phone: string }) {
  if (!account) {
    return (
      <Callout icon={<CheckCircle2 size={16} />} variant="success">
        <strong>No. HP belum terdaftar sebagai akun Ruangguru</strong>
      </Callout>
    )
  }

  if (mode === 'new') {
    return (
      <Callout variant="danger">
        <strong>No. HP sudah terdaftar sebagai akun Orang Tua</strong>
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
        leadStatus={account.leadStatus}
        lastLoginAt={account.lastLoginAt}
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
    <SectionCard className="payment-card" title="Rincian Harga">
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

function ReviewSheet({ accountStatus, childName, consent, grade, lookupState, parentName, parentPhone, phone, profileTarget, selectedParentLookupProfileId, selectedChildSearchProfileId, setConsent, usesParentIdentity, onClose, onContinue }: {
  accountStatus: AccountStatus | null
  childName: string
  consent: boolean
  grade: string
  lookupState: LookupState
  parentName: string
  parentPhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedParentLookupProfileId: string
  selectedChildSearchProfileId: string
  setConsent: (value: boolean) => void
  usesParentIdentity: boolean
  onClose: () => void
  onContinue: () => void
}) {
  const isNewAccount = accountStatus === 'new' && lookupState === 'new-available'
  const parentAccount = getLookupParentAccount(lookupState)
  const selectedProfile = parentAccount?.profiles.find((profile) => profile.id === selectedParentLookupProfileId)
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
  useEffect(() => {
    const scrollY = window.scrollY
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = '-' + scrollY + 'px'
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [])

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
