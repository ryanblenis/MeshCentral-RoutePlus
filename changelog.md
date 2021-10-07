# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Known Issues]
- None. Please feel free to submit an issue via [GitHub](https://github.com/ryanblenis/MeshCentral-RoutePlus) if you find anything.

## [0.1.4] - 2021-10-07
### Fixed
- Compatibility with MeshCentral > 0.9.7

## [0.1.3] - 2020-04-21
### Fixed
- RDP file download issue in FireFox for some OS's would show "Server Disconnected"
- Make "RoutePlus RDP" link on devices add/remove on current device without refreshing the page or switching devices first

## [0.1.2] - 2020-04-08
### Fixed
- Changed display so that computer list and mappings do not overlap on smaller resolutions

## [0.1.1] - 2020-04-08
### Added
- Added destination IP (target IP) for accessing remote node network

## [0.1.0] - 2020-04-08
### Added
- Ability to set a static source port. If the chosen port is unavailable (e.g. in use), the mapping will be disabled until it is free and the map is reinstantiated.
### Fixed
- Added rPi icon option (was previously displaying blank)
- Stability fixes for keeping the same randomly generated port. This should reduce the number of times the port is changed for some users.

## [0.0.7] - 2020-04-05
### Fixed
- Remove unused call for mesh name that broke support for the new "Individual Device Permissions" users

## [0.0.6] - 2020-03-07
### Fixed
- Prevent race condition with conflicting plugins changing the app views directory by using absolute paths

## [0.0.5] - 2020-01-08
### Fix
- Cleanup console messages for currentNode not yet avail

## [0.0.4] - 2020-01-03
### Fix
- Fix so that adding / removing multiple plugins only yields one RoutePlus settings link

## [0.0.3] - 2019-12-31
### Added
- Option to add an RDP link to the device landing page. Applies to RDP and Custom protocols. If checked, will add a link to download an RDP file.

## [0.0.2] - 2019-12-29
### Fixed
- Better integrated route selection settings into MeshCentral interface (no more popout)

## [0.0.1] - 2019-12-26
### Added
- Released initial version
