import {useEffect,useId,useRef} from 'react';
import type {ReactNode} from 'react';
import {Icon} from './Icon';
interface ModalProps {title:string;onClose:()=>void;children:ReactNode}
export function Modal({title,onClose,children}:ModalProps){const ref=useRef<HTMLDialogElement>(null);const titleId=useId();useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);return <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><header><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Tutup dialog"><Icon name="close"/></button></header><div className="modal-content">{children}</div></dialog>}
