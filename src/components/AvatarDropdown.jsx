import {
	BadgeCheck,
	CreditCard,
	LayoutDashboard,
	MessageCircle,
	Search,
	UserRound,
} from "lucide-react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AvatarDropdown() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
					aria-label="Abrir accesos rápidos"
				>
					<Avatar className="h-9 w-9 border border-white/15 bg-white/5">
						<AvatarImage
							src="/avatar-persona-header.svg"
							alt="Accesos rápidos"
						/>
						<AvatarFallback className="bg-[#8C5E42]/15 text-[#C4895E]">
							<UserRound className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 border-white/10 bg-forest-600/98 p-2 text-white shadow-2xl shadow-black/30 backdrop-blur-md"
			>
				<DropdownMenuGroup>
					<div className="px-2 py-2">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
							Accesos rapidos
						</p>
						<p className="mt-1 text-sm font-medium text-white">
							Tu cuenta de viaje
						</p>
					</div>
					<DropdownMenuItem asChild className="rounded-lg text-white/80 focus:bg-white/10 focus:text-white">
						<a href="#consultar-reserva">
							<Search className="h-4 w-4 text-[#C4895E]" />
							Consultar reserva
						</a>
					</DropdownMenuItem>
					<DropdownMenuItem asChild className="rounded-lg text-white/80 focus:bg-white/10 focus:text-white">
						<a href="#pagar-con-codigo">
							<CreditCard className="h-4 w-4 text-[#C4895E]" />
							Pagar con codigo
						</a>
					</DropdownMenuItem>

				</DropdownMenuGroup>
				<DropdownMenuSeparator className="bg-white/10" />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild className="rounded-lg text-white/80 focus:bg-white/10 focus:text-white">
						<a href="/?admin=true">
							<LayoutDashboard className="h-4 w-4 text-[#C4895E]" />
							Panel admin
						</a>
					</DropdownMenuItem>
					<DropdownMenuItem className="rounded-lg text-white/80 focus:bg-white/10 focus:text-white">
						<BadgeCheck className="h-4 w-4 text-[#C4895E]" />
						Servicio verificado
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default AvatarDropdown;