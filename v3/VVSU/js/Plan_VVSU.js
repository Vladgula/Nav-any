let planXML = `<Plan building="VVSU">

	<Building name="Главный корпус" id="1">

		<Block id="building1_floor4" floor="4" name="Этаж 4" building="1">

			<!-- Лестничная площадка № 1 -->
			<Square id="landing_1" name="Лестничная площадка" to="лестничной площадки">
				<Side dir="backward">
					<Joint id="1" text="Лестница" to="лестницы"/>
				</Side>
				<Side dir="right" type="window">
					<Orient type="trash_bin" name="Урна для мусора" to="урны для мусора"/>
					<Orient type="rest+charge" name="Диваны с зарядкой" to="диванов с зарядкой"/>
				</Side>
				<Side dir="forward">
					<Orient type="door" name="Дверь" to="двери"/>
					<Orient type="info_desk" name="Плакат СВО" to="плаката СВО"/>
				</Side>
				<Side dir="left">
					<Part type="free">
						<Joint id="2" text="Поворот" to="поворота"/>
					</Part>
					<Part type="wall">
						<Orient type="fire_extinguisher" name="Огнетушитель" to="огнетушителя"/>
					</Part>
				</Side>
			</Square>

			<!-- Площадка у коридора, ведущего к аудиториям -->
			<Square id="square_2">
				<Side dir="backward" type="free">
					<Joint id="2" text="Поворот" to="поворота"/>
				</Side>
				<Side dir="right" type="wall">
					<Room num="1431"/>
					<Orient type="rest+charge" name="Диван с зарядкой" to="дивана с зарядкой"/>
					<Room num="1433"/>
				</Side>
				<Side dir="forward">
					<Part type="wall"/>
					<Part type="free">
						<Joint id="3" text="Поворот" to="поворота"/>
					</Part>
				</Side>
				<Side dir="left" type="wall">
					<Room num="1426" name="Преподавательская кафедры ИТС"/>
					<Room num="1424"/>
				</Side>
			</Square>

			<!-- Коридор № 1 -->
			<Corridor id="corridor_1" start="3" finish="4" name="Коридор" to="коридора">
				<Room wall="right" num="1435"/>
				<Room wall="left" num="1428" name="Подсобное помещение"/>
				<Toilet wall="left" num="1430" type="M" name="Мужской туалет"/>
				<Room wall="right" num="1437"/>
				<Room wall="left" num="1432"/>
				<Room wall="left" num="1434"/>
				<Room wall="right" num="1439"/>
				<Room wall="left" num="1436"/>
				<Room wall="right" num="1431"/>
				<Orient wall="right" type="info_desk" name="Информационный стенд кафедры"/>
				<Room wall="left" num="1438"/>
				<Room wall="right" num="1443" name="Кафедра математики и моделирования"/>
				<Room wall="right" num="1445"/>
				<Room wall="left" num="1440"/>
				<Room wall="right" num="1447"/>
				<Room wall="left" num="1442"/>
			</Corridor>

			<!-- Промежуточная площадка-поворот -->
			<Square id="square_3">
				<Side dir="backward" type="free">
					<Joint id="4" text="Поворот налево" to="поворота налево"/>
				</Side>
				<Side dir="forward" type="free">
					<Joint id="5" text="Поворот направо" to="поворота направо"/>
				</Side>
				<Side dir="right" type="wall"/>
				<Side dir="left" type="free">
					<Joint id="6" text="Поворот" to="поворота"/>
				</Side>
			</Square>

			<!-- Зона отдыха -->
			<Square id="square_rest" name="Зона отдыха" to="зоны отдыха" cat="rest">
				<Side dir="backward" type="free">
					<Joint id="6" text="Поворот" to="поворота"/>
				</Side>
				<Side dir="left" type="wall">
					<Orient type="rest" name="Диван" to="дивана"/>
				</Side>
				<Side dir="right" type="wall">
					<Orient type="rest" name="Диван" to="дивана"/>
				</Side>
				<Side dir="forward" type="window"/>
			</Square>

			<!-- Коридор № 2 -->
			<Corridor id="corridor_2" start="5" finish="7" name="Коридор" to="коридора">
				<Orient wall="left" type="fire_extinguisher" name="Огнетушитель" to="огнетушителя"/>
				<Orient wall="left" type="info_desk" name="План эвакуации" to="плана эвакуации"/>
				<Room wall="left" num="1444"/>
				<Room wall="right" num="1449"/>
				<Room wall="right" num="1451"/>
				<Room wall="left" num="1446" name="Зав. кафедрой ИТС"/>
				<Room wall="right" num="1453"/>
				<Orient wall="left" type="info_desk" name="Схема этажа" to="схемы этажа"/>
				<Orient wall="left" type="info_desk" name="Информационный стенд кафедры ИТС" to="информационного стенда"/>
				<Room wall="left" num="1448" name="Преподавательская кафедры ИТС"/>
			</Corridor>

			<!-- Лестничная площадка № 2 -->
			<Square id="landing_2" name="Лестничная площадка" to="лестничной площадки">
				<Side dir="backward" type="free">
					<Joint id="7" text="Лестница" to="лестницы"/>
				</Side>
				<Side dir="right" type="window">
					<Orient type="rest" name="Диван" to="дивана"/>
				</Side>
				<Side dir="forward" type="wall">
					<Room num="1457"/>
					<Orient type="rest" name="Диван" to="дивана"/>
				</Side>
				<Side dir="left">
					<Joint id="8" text="Лестница" to="лестницы"/>
				</Side>
			</Square>

			<!-- Лестницы: связывают стык 1 и стык 7 с соседними этажами -->
			<Stairs id="stairs_up_1"   joint="1" floor_down="3" floor_up="4" building="1"
			        text_up="Поднимитесь на 4 этаж"
			        text_down="Спуститесь на 3 этаж"/>
			<Stairs id="stairs_down_1" joint="1" floor_down="4" floor_up="5" building="1"
			        text_up="Поднимитесь на 5 этаж"
			        text_down="Спуститесь на 4 этаж"/>
			<Stairs id="stairs_up_2"   joint="7" floor_down="3" floor_up="4" building="1"
			        text_up="Поднимитесь на 4 этаж"
			        text_down="Спуститесь на 3 этаж"/>
			<Stairs id="stairs_down_2" joint="7" floor_down="4" floor_up="5" building="1"
			        text_up="Поднимитесь на 5 этаж"
			        text_down="Спуститесь на 4 этаж"/>
			<Stairs id="stairs_landing_2" joint="8" floor_down="4" floor_up="4" building="1"
			        text_up="" text_down=""/>

		</Block>

	</Building>

</Plan>`;