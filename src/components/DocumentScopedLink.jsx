import { Link as RouterLink, NavLink as RouterNavLink, useLocation } from 'react-router-dom';

function useDocumentNavigation(to) {
  const { pathname } = useLocation();
  const destination = typeof to === 'string' ? to : to?.pathname;
  // Response Permissions-Policy belongs to the document. Crossing the exact
  // assistant route must obtain a new policy in either direction.
  return pathname === '/assistant' || destination === '/assistant';
}

export function Link(props) {
  return <RouterLink {...props} reloadDocument={useDocumentNavigation(props.to)} />;
}

export function NavLink(props) {
  return <RouterNavLink {...props} reloadDocument={useDocumentNavigation(props.to)} />;
}
